const _ = require("lodash")
const logger = require("./logger")
const discord = require("./discord")
const random = require("./random")
const util = require("util")
const constants = require("./constants")

const IN_GAME_STATES = constants.IN_GAME_STATES
const TTW_EVENTS = constants.TTW_EVENTS


class Gather {

    currentSize = 6
    currentQueue = []
    rematchQueue = []
    alphaTeam = []
    bravoTeam = []
    inGameState = IN_GAME_STATES["NO_GATHER"]
    numberOfBunkers = 0
    password = undefined
    events = []
    startTime = undefined
    endTime = undefined
    currentMap = undefined
    kickTimers = {}
    authCodes = {}
    playerNameToHwid = {}
    hwidToDiscordId = {}

    // TODO: Could get rid of this by adding a --- status command that revealed everyone's starting roles
    playerNameToCurrentClassId = {}

    constructor(soldatClient, discordChannel, statsDb, hwidToDiscordId, getCurrentTimestamp) {
        this.soldatClient = soldatClient
        this.discordChannel = discordChannel
        this.statsDb = statsDb
        this.hwidToDiscordId = hwidToDiscordId
        this.getCurrentTimestamp = getCurrentTimestamp
    }

    gatherInProgress() {
        return this.inGameState !== IN_GAME_STATES.NO_GATHER
    }

    gatherHasStarted() {
        return this.inGameState === IN_GAME_STATES.GATHER_STARTED
    }

    displayQueue(size, queue, mapName, rematch = false) {
        const queueMembers = queue.map(user => `<@${user.id}>`)
        for (let i = 0; i < size - queue.length; i++) {
            queueMembers.push(":bust_in_silhouette:")
        }

        this.discordChannel.send({
            embed: {
                title: "Gather Info",
                color: 0xff0000,
                fields: [
                    {
                        name: "Current Queue" + (rematch ? " (rematch)" : ""),
                        value: `${queueMembers.join(" - ")}`
                    },
                    discord.getMapField(mapName),
                ]
            }
        })
    }

    startNewGame() {
        const shuffledQueue = _.shuffle(this.currentQueue)

        const alphaDiscordUsers = _.slice(shuffledQueue, 0, this.currentSize / 2)
        const bravoDiscordUsers = _.slice(shuffledQueue, this.currentSize / 2, this.currentSize)

        this.startGame(alphaDiscordUsers, bravoDiscordUsers)
    }

    startGame(alphaDiscordUsers, bravoDiscordUsers) {
        this.password = random.getRandomString()

        this.alphaTeam = alphaDiscordUsers
        this.bravoTeam = bravoDiscordUsers
        this.inGameState = IN_GAME_STATES["GATHER_PRE_RESET"]

        const alphaDiscordIds = this.alphaTeam.map(user => user.id)
        const bravoDiscordIds = this.bravoTeam.map(user => user.id)

        this.soldatClient.setServerPassword(this.password, () => {

            this.soldatClient.getServerInfo(serverInfo => {
                [...alphaDiscordUsers, ...bravoDiscordUsers].forEach(user => {
                    user.send({
                        embed: {
                            title: "Gather Started",
                            color: 0xff0000,
                            fields: [
                                discord.getServerLinkField(this.password),
                                ...discord.getPlayerFields(alphaDiscordIds, bravoDiscordIds),
                                discord.getMapField(serverInfo["mapName"])
                            ]
                        }
                    })
                })

                this.discordChannel.send({
                    embed: {
                        title: "Gather Started",
                        color: 0xff0000,
                        fields: [
                            ...discord.getPlayerFields(alphaDiscordIds, bravoDiscordIds),
                            discord.getMapField(serverInfo["mapName"])
                        ]
                    }
                })
            })
        })
    }

    endGame(alphaTickets, bravoTickets, alphaCaps, bravoCaps) {
        if (alphaTickets === 0 && bravoTickets === 0 && alphaCaps === 0 && bravoCaps === 0) {
            logger.log.warn("Bogus gather end event encountered, ignoring.")
            return
        }

        this.endTime = this.getCurrentTimestamp()

        const alphaDiscordIds = this.alphaTeam.map(user => user.id)
        const bravoDiscordIds = this.bravoTeam.map(user => user.id)

        const game = {
            alphaPlayers: alphaDiscordIds,
            bravoPlayers: bravoDiscordIds,
            alphaTickets: alphaTickets,
            bravoTickets: bravoTickets,
            startTime: this.startTime,
            endTime: this.endTime,
            events: this.events,
            numberOfBunkers: this.numberOfBunkers,
            mapName: this.currentMap,
            size: this.currentSize,
        }

        this.statsDb.insertGame(game).then().catch(e => logger.log.error(`Error when saving game to DB: ${e}`))

        this.inGameState = IN_GAME_STATES.NO_GATHER
        this.currentQueue = []
        this.rematchQueue = []
        this.playerNameToCurrentClassId = {}
        this.password = ""

        this.soldatClient.changeMap(constants.MAPS_LIST[random.getRandomInt(0, constants.MAPS_LIST.length)])
        this.soldatClient.setServerPassword("")

        this.discordChannel.send({
            embed: {
                title: "Gather Finished",
                color: 0xff0000,
                fields: discord.getGatherEndFields(game),
            }
        })
    }

    gatherStart(mapName, size, numberOfBunkers) {
        this.startTime = this.getCurrentTimestamp()
        this.inGameState = IN_GAME_STATES["GATHER_STARTED"]
        this.numberOfBunkers = numberOfBunkers
        this.currentMap = mapName

        // This clearing of events needs to happen on gather start rather than gather end, because sometimes
        // there are multiple resets before the gather ends, and those events should be cleared.
        this.events = []

        this.discordChannel.send({
            embed: {
                title: "Gather Started",
                color: 0xff0000,
                description: `Size ${size} gather started on **${mapName}**. GLHF!`
            }
        })

        // When the gather starts, we push a class switch event for every player based on whatever we know they have
        // picked up to this point. This is because we players are able to pick their task prior to the gather being
        // reset. This ensures that every gather has at least 1 class switch event for every player, for proper stats
        // to be calculated. Its okay to not clear this list across gathers, at technically a player could already
        // be on the server and have chosen his/her class before the gather starts.

        _.forEach(this.playerNameToCurrentClassId, (classId, playerName) => {
            const discordId = this.translatePlayerNameToDiscordId(playerName)
            if (this.alphaTeam.map(user => user.id).includes(discordId) || this.bravoTeam.map(user => user.id).includes(discordId)) {
                this.pushEvent(TTW_EVENTS.PLAYER_CLASS_SWITCH, {
                    timestamp: this.startTime,
                    discordId: discordId,
                    newClassId: classId,
                })
            }
        })
    }

    translatePlayerNameToDiscordId(playerName) {

        // Should only happen if somehow we failed to grab the HWID when they joined
        if (!(playerName in this.playerNameToHwid)) {
            logger.log.error(`${playerName} not found in PlayerName -> HWID map, shouldn't happen! Using in-game name as Discord ID`)
            return playerName
        }

        const hwid = this.playerNameToHwid[playerName]

        /// Should only happen if the gather has started and the player isn't yet authenticated
        if (!(hwid in this.hwidToDiscordId)) {
            logger.log.warn(`${playerName} is not yet authenticated; did not find in HWID -> DiscordID map. Using in-game name as Discord ID`)
            return playerName
        }

        return this.hwidToDiscordId[hwid]
    }

    flagCap(playerName, teamName) {
        this.pushEvent(TTW_EVENTS.FLAG_CAP, {
            discordId: this.translatePlayerNameToDiscordId(playerName),
            teamName
        })

        this.discordChannel.send({
            embed: {
                title: `${teamName} cap`,
                color: 0xff0000,
                description: `**${playerName}** scored for the **${teamName}** team!`
            }
        })
    }

    gatherPause() {
        this.pushEvent(TTW_EVENTS.GATHER_PAUSE)

        this.discordChannel.send({
            embed: {
                title: `Gather Paused`,
                color: 0xff0000,
            }
        })
    }

    gatherUnpause() {
        this.pushEvent(TTW_EVENTS.GATHER_UNPAUSE)

        this.discordChannel.send({
            embed: {
                title: `Gather Unpaused`,
                color: 0xff0000,
                description: "GO GO GO"
            }
        })
    }

    pushEvent(eventType, eventBody = {}) {
        const event = {
            type: eventType,
            timestamp: this.getCurrentTimestamp(),
            ...eventBody
        }

        logger.log.info(`Pushing event ${util.inspect(event)}`)
        this.events.push(event)
    }

    playerCommand(playerName, currentClass, command) {
        if (command.startsWith("auth")) {
            const split = command.split(" ")
            if (split.length !== 2) {
                this.soldatClient.messagePlayer("Usage: /auth <authcode>")
                return
            }

            const authCode = split[1]
            this.playerInGameAuth(playerName, authCode)
        }
    }

    playerAdd(discordUser) {
        if (!this.currentQueue.includes(discordUser)) {
            this.currentQueue.push(discordUser)

            if (this.currentQueue.length === this.currentSize) {
                this.startNewGame()
            } else {
                this.soldatClient.getServerInfo(serverInfo => {
                    this.displayQueue(this.currentSize, this.currentQueue, serverInfo["mapName"])
                })
            }
        }
    }

    playerRematchAdd(discordUser) {
        this.statsDb.getLastGame().then(lastGame => {
            if (![...lastGame.alphaPlayers, ...lastGame.bravoPlayers].includes(discordUser.id)) {
                discordUser.reply("you did not play in the last gather.")
                return
            }

            if (!this.rematchQueue.includes(discordUser)) {
                this.rematchQueue.push(discordUser)

                if (this.rematchQueue.length === lastGame.size) {
                    // Flip teams
                    const alphaDiscordUsers = _.filter(this.rematchQueue, user => lastGame.bravoPlayers.includes(user.id))
                    const bravoDiscordUsers = _.filter(this.rematchQueue, user => lastGame.alphaPlayers.includes(user.id))

                    this.soldatClient.changeMap(lastGame.mapName, () => {
                        this.startGame(alphaDiscordUsers, bravoDiscordUsers)
                    })
                } else {
                    this.displayQueue(lastGame.size, this.rematchQueue, lastGame.mapName, true)
                }
            } else {
                this.displayQueue(lastGame.size, this.rematchQueue, lastGame.mapName, true)
            }
        })
    }

    playerClassSwitch(playerName, classId) {

        // Only register events if this gather has started; otherwise just add to the map.
        if (this.gatherHasStarted()) {
            this.pushEvent(TTW_EVENTS.PLAYER_CLASS_SWITCH, {
                discordId: this.translatePlayerNameToDiscordId(playerName),
                newClassId: classId,
            })
        }

        this.playerNameToCurrentClassId[playerName] = classId
    }

    conquer(conqueringTeam, alphaTickets, bravoTickets, currentAlphaBunker, currentBravoBunker, sabotaging) {
        this.pushEvent(TTW_EVENTS.BUNKER_CONQUER, {
            conqueringTeam,
            alphaTickets,
            bravoTickets,
            currentAlphaBunker,
            currentBravoBunker,
            sabotaging
        })
    }

    playerKill(killerTeam, killerName, victimTeam, victimName, weapon) {
        this.pushEvent(TTW_EVENTS.PLAYER_KILL, {
            killerDiscordId: this.translatePlayerNameToDiscordId(killerName),
            victimDiscordId: this.translatePlayerNameToDiscordId(victimName),
            killerTeam,
            victimTeam,
            weaponId: weapon.id
        })
    }

    playerJoin(playerName) {
        this.soldatClient.getPlayerHwid(playerName, hwid => {
            logger.log.info(`${playerName} joined with HWID ${hwid}`)

            this.playerNameToHwid[playerName] = hwid

            if (hwid in this.hwidToDiscordId) {
                const discordId = this.hwidToDiscordId[hwid]

                this.discordChannel.client.fetchUser(discordId).then(discordUser => {
                    this.soldatClient.messagePlayer(playerName, `You are authenticated in Discord as ${discordUser.username}`)
                })

                logger.log.info(`${playerName} (${hwid}) found in HWID map, no auth needed. Discord ID: ${discordId}`)

            } else {
                logger.log.info(`${playerName} (${hwid}) not found in HWID map, asking to auth and kicking in ${constants.NOT_AUTHED_KICK_TIMER_SECONDS} seconds`)

                this.soldatClient.messagePlayer(playerName, "You are currently not authenticated. Please type !auth in the gather channel. " +
                    `Kicking in ${constants.NOT_AUTHED_KICK_TIMER_SECONDS} seconds.`)

                this.kickTimers[playerName] = setTimeout(() => {
                    this.soldatClient.kickPlayer(playerName)
                }, constants.NOT_AUTHED_KICK_TIMER_SECONDS * 1000)
            }
        })
    }

    playerLeave(playerName) {
        delete this.playerNameToHwid[playerName]
    }

    playerInGameAuth(playerName, authCode) {
        if (!(authCode in this.authCodes)) {
            this.soldatClient.messagePlayer(playerName, "Invalid auth code. Please type !auth in the gather channel and check your PMs.")
            return
        }

        const discordId = this.authCodes[authCode]
        this.soldatClient.getPlayerHwid(playerName, hwid => {
            logger.log.info(`Authenticating ${playerName} with HWID ${hwid} (discord ID ${discordId})`)

            this.statsDb.mapHwidToDiscordId(hwid, discordId).then(async () => {
                this.soldatClient.messagePlayer(playerName, "You have been successfully authenticated.")
                logger.log.info(`${playerName} successfully authenticated, clearing kick timer and auth code...`)
                clearTimeout(this.kickTimers[playerName])
                delete this.authCodes[authCode]
                this.statsDb.getHwidToDiscordIdMap().then(hwidToDiscordId => {
                    this.hwidToDiscordId = hwidToDiscordId
                })
            })
        })
    }

    playerDiscordAuth(discordId) {
        const authCode = random.getRandomString()
        this.authCodes[authCode] = discordId
        return authCode
    }

    playerSay(playerName, message) {
        this.discordChannel.send(`[${playerName}] ${message}`)
    }
}

module.exports = {
    Gather
}

