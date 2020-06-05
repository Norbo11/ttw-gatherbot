const _ = require("lodash")
const logger = require("./logger")
const discord = require("./discord")
const constants = require("../constants")
const random = require("./random")
const util = require("util")

MAPS_LIST = [
    "ttw_42ndWood", "ttw_Borderwars", "ttw_Concrete", "ttw_Forgotten", "ttw_Junkyard", "ttw_Mudder", "ttw_rime", "ttw_Take", "ttw_Village",
    "ttw_Afrique", "ttw_Bridge", "ttw_crater", "ttw_Fort", "ttw_kaibatsu", "ttw_Myst2", "ttw_Rime", "ttw_Tenshin2", "ttw_Waste",
    "ttw_afterGlory", "ttw_cadet", "ttw_crecent", "ttw_fortress", "ttw_kamiquasi", "ttw_Myst", "ttw_Tenshin", "ttw_WIP",
    "ttw_Alize", "ttw_Caen", "ttw_Creek", "ttw_Frostbite", "ttw_Kampfer", "ttw_NewNature", "ttw_rover", "ttw_Teroya", "ttw_Ypres-fix",
    "ttw_alphathing", "ttw_Cangaceiros", "ttw_crimson", "ttw_frost", "ttw_Krath", "ttw_Nomans", "ttw_shaft", "ttw_tower",
    "ttw_Anoxi", "ttw_cannibals", "ttw_Dawn", "ttw_generic", "ttw_Limbo", "ttw_nworld", "ttw_Skybridge", "ttw_Toxic",
    "ttw_art", "ttw_castle", "ttw_desert", "ttw_Gloryhill", "ttw_marsh", "ttw_paperwar", "ttw_Skyscrapers", "ttw_Trainyards", "ttw_Ypres_n",
    "ttw_Autumn", "ttw_Cathedral", "ttw_Drain", "ttw_Grasshill", "ttw_meteorite", "ttw_Pinewood", "ttw_SoldiersFoly", "ttw_Untitled3", "ttw_Ypres",
    "ttw_Bachvu", "ttw_ColdMorning", "ttw_El_Alamein", "ttw_hue", "ttw_Mound", "Kopia", "ttw_Plat", "ttw_storm", "ttw_Valley",
    "ttw_BattleField", "ttw_ColdMorning.old", "ttw_Forest", "ttw_Junkyard2", "ttw_Mound", "ttw_Rage", "ttw_Struggle", "ttw_Verdun"
]


IN_GAME_STATES = {
    NO_GATHER: "NO_GATHER",
    GATHER_PRE_RESET: "GATHER_PRE_RESET",
    GATHER_STARTED: "GATHER_STARTED",
}

NOT_AUTHED_KICK_TIMER_SECONDS = 60


// The IDs here must match the IDs in the TTW script
const TTW_CLASSES = {
    LONG_RANGE_INFANTRY: {
        id: "1",
        name: "LONG_RANGE_INFANTRY",
        aliases: ["LONG", "LRI"],
        formattedName: "Long Range Infantry",
    },
    SHORT_RANGE_INFANTRY: {
        id: "2",
        name: "SHORT_RANGE_INFANTRY",
        aliases: ["SHORT", "SRI"],
        formattedName: "Short Range Infantry",
    },
    MEDIC: {
        id: "3",
        name: "MEDIC",
        aliases: ["MEDIC", "MED", "DOC"],
        formattedName: "General",
    },
    GENERAL: {
        id: "4",
        name: "GENERAL",
        aliases: ["GENERAL", "GEN"],
        formattedName: "General",
    },
    RADIOMAN: {
        id: "5",
        name: "RADIOMAN",
        aliases: ["RADIOMAN", "RAD"],
        formattedName: "Radioman",
    },
    SABOTEUR: {
        id: "6",
        name: "SABOTEUR",
        aliases: ["SABOTEUR", "SABO"],
        formattedName: "Saboteur",
    },
    ENGINEER: {
        id: "7",
        name: "ENGINEER",
        aliases: ["ENGINEER", "ENG"],
        formattedName: "Engineer",
    },
    ELITE: {
        id: "8",
        name: "ELITE",
        aliases: ["ELITE", "ELI", "SNIPER", "SNIP"],
        formattedName: "Elite",
    },
    SPY: {
        id: "9",
        name: "SPY",
        aliases: ["SPY"],
        formattedName: "Spy",
    },
    ARTILLERY: {
        id: "10",
        name: "ARTILLERY",
        aliases: ["ARTILLERY", "ART"],
        formattedName: "Artillery",
    },
}

const TTW_EVENTS = {
    PLAYER_CLASS_SWITCH: "PLAYER_CLASS_SWITCH",
    FLAG_CAP: "FLAG_CAP",
    GATHER_PAUSE: "GATHER_PAUSE",
    GATHER_UNPAUSE: "GATHER_UNPAUSE",
    BUNKER_CONQUER: "BUNKER_CONQUER",
    PLAYER_KILL: "PLAYER_KILL"
}

getClassById = (id) => {
    const key = _.findKey(TTW_CLASSES, ttwClass => ttwClass.id === id)
    return TTW_CLASSES[key]
}


class Gather {

    currentSize = 6
    currentQueue = []
    alphaTeam = []
    bravoTeam = []
    inGameState = IN_GAME_STATES["NO_GATHER"]
    numberOfBunkers = 0
    serverPassword = undefined
    events = []
    startTime = undefined
    endTime = undefined
    currentGeneral = undefined
    currentRadioman = undefined
    currentMap = undefined
    kickTimers = {}
    authCodes = {}
    playerNameToHwid = {}
    hwidToDiscordId = {}
    playerNameToCurrentClassId = {}

    constructor(soldatClient, discordChannel, statsDb, hwidToDiscordId) {
        this.soldatClient = soldatClient
        this.discordChannel = discordChannel
        this.statsDb = statsDb
        this.hwidToDiscordId = hwidToDiscordId
    }

    getPlayerStrings(delim = "\n") {
        const alphaPlayersString = this.alphaTeam.length > 0 ? this.alphaTeam.map(user => `<@${user.id}>`).join(delim) : "No players"
        const bravoPlayersString = this.bravoTeam.length > 0 ? this.bravoTeam.map(user => `<@${user.id}>`).join(delim) : "No players"

        return {alphaPlayersString, bravoPlayersString}
    }

    getPlayerFields() {
        const {alphaPlayersString, bravoPlayersString} = this.getPlayerStrings()

        return [
            {
                name: `${discord.teamEmoji("Alpha")} Alpha Team`,
                value: `${alphaPlayersString}`,
                inline: true
            },
            {
                name: `${discord.teamEmoji("Bravo")} Bravo Team`,
                value: `${bravoPlayersString}`,
                inline: true
            }
        ];
    }

    getMapField(mapName) {
        return {
            name: "Map",
            value: `${mapName}`,
        }
    }

    getServerLinkField(password = "goaway") {
        return {
            name: "Link",
            value: `soldat://${constants.SERVER_IP}:${constants.SERVER_PORT}/${password}`,
        }
    }

    gatherInProgress() {
        return this.inGameState !== IN_GAME_STATES.NO_GATHER
    }

    gatherHasStarted() {
        return this.inGameState === IN_GAME_STATES.GATHER_STARTED
    }

    displayQueue(serverInfo) {
        const queueMembers = this.currentQueue.map(user => `<@${user.id}>`)
        for (let i = 0; i < this.currentSize - this.currentQueue.length; i++) {
            queueMembers.push(":bust_in_silhouette:")
        }

        this.discordChannel.send({
            embed: {
                title: "Gather Info",
                color: 0xff0000,
                fields: [
                    {
                        name: "Current Queue",
                        value: `${queueMembers.join(" - ")}`
                    },
                    this.getMapField(serverInfo["mapName"])
                ]
            }
        })
    }

    startGame() {
        const shuffledQueue = _.shuffle(this.currentQueue)

        const alphaPlayers = _.slice(shuffledQueue, 0, this.currentSize / 2)
        const bravoPlayers = _.slice(shuffledQueue, this.currentSize / 2, this.currentSize)

        const password = random.getRandomString()

        this.alphaTeam = alphaPlayers
        this.bravoTeam = bravoPlayers
        this.inGameState = IN_GAME_STATES["GATHER_PRE_RESET"]

        this.soldatClient.setServerPassword(password, () => {
            this.serverPassword = password

            this.soldatClient.getServerInfo(serverInfo => {
                shuffledQueue.forEach(user => {
                    user.send({
                        embed: {
                            title: "Gather Started",
                            color: 0xff0000,
                            fields: [
                                this.getServerLinkField(password),
                                ...this.getPlayerFields(),
                                this.getMapField(serverInfo["mapName"])
                            ]
                        }
                    })
                })

                this.discordChannel.send({
                    embed: {
                        title: "Gather Started",
                        color: 0xff0000,
                        fields: [
                            ...this.getPlayerFields(),
                            this.getMapField(serverInfo["mapName"])
                        ]
                    }
                })
            })
        })
    }

    endGame(alphaTickets, bravoTickets, alphaCaps, bravoCaps) {
        this.endTime = Date.now()

        const {alphaPlayersString, bravoPlayersString} = this.getPlayerStrings(" - ")

        const winningTeam = alphaTickets > bravoTickets ? "Alpha" : "Bravo"
        const losingTeam = alphaTickets > bravoTickets ? "Bravo" : "Alpha"
        const winnerTickets = alphaTickets > bravoTickets ? alphaTickets : bravoTickets
        const loserTickets = alphaTickets > bravoTickets ? bravoTickets : alphaTickets
        const winnerCaps = alphaTickets > bravoTickets ? alphaCaps : bravoCaps
        const loserCaps = alphaTickets > bravoTickets ? bravoCaps : alphaCaps
        const winningPlayersString = alphaTickets > bravoTickets ? alphaPlayersString : bravoPlayersString
        const losingPlayersString = alphaTickets > bravoTickets ? bravoPlayersString : alphaPlayersString

        this.inGameState = IN_GAME_STATES["NO_GATHER"]
        this.currentQueue = []

        this.soldatClient.changeMap(MAPS_LIST[random.getRandomInt(0, MAPS_LIST.length)])
        this.soldatClient.setServerPassword("")

        this.serverPassword = ""

        this.statsDb.insertGame({
            alphaPlayers: this.alphaTeam.map(user => user.id),
            bravoPlayers: this.bravoTeam.map(user => user.id),
            alphaTickets: alphaTickets,
            bravoTickets: bravoTickets,
            startTime: this.startTime,
            endTime: this.endTime,
            events: this.events,
            numberOfBunkers: this.numberOfBunkers,
            mapName: this.currentMap
        }).then().catch(e => logger.log.error(`Error when saving game to DB: ${e}`))

        this.discordChannel.send({
            embed: {
                title: "Gather Finished",
                color: 0xff0000,
                fields: [
                    {
                        name: `**Winning Team (${winnerTickets} tickets left) (${winnerCaps} caps)**`,
                        value: `${discord.teamEmoji(winningTeam)}: ${winningPlayersString}`,
                    },
                    {
                        name: `Losing Team (${loserTickets} tickets left) (${loserCaps} caps)`,
                        value: `${discord.teamEmoji(losingTeam)}: ${losingPlayersString}`,
                    },
                ]
            }
        })
    }

    gatherStart(mapName, size, numberOfBunkers) {
        this.inGameState = IN_GAME_STATES["GATHER_STARTED"]
        this.numberOfBunkers = numberOfBunkers
        this.startTime = Date.now()
        this.currentMap = mapName

        this.discordChannel.send({
            embed: {
                title: "Gather Started",
                color: 0xff0000,
                description: `Size ${size} gather started on **${mapName}**. GLHF!`
            }
        })

        // When the gather starts, we push a class switch event for every player based on whatever we know they have
        // picked up to this point. This is because we can't assume that players haven't chosen their task prior to the
        // reset, when we don't want to process any events, as the gather hasn't started yet. This ensures that every
        // gather has at least 1 class switch event for every player, for proper stats to be calculated.

        _.forEach(this.playerNameToCurrentClassId, (classId, playerName) => {
            this.pushEvent(TTW_EVENTS.PLAYER_CLASS_SWITCH, {
                timestamp: this.startTime,
                discordId: this.translatePlayerNameToDiscordId(playerName),
                newClassId: classId,
            })
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
            timestamp: Date.now(),
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

    playerClassSwitch(playerName, classId) {

        // Only register events if this gather has started; otherwise just add to the map.
        if (this.gatherHasStarted()) {
            this.pushEvent(TTW_EVENTS.PLAYER_CLASS_SWITCH, {
                discordId: this.translatePlayerNameToDiscordId(playerName),
                newClassId: classId,
            })
        }

        if (classId === TTW_CLASSES.GENERAL.id) {
            this.currentGeneral = playerName
        }

        if (classId === TTW_CLASSES.RADIOMAN.id) {
            this.currentRadioman = playerName
        }

        this.playerNameToCurrentClassId[playerName] = classId
    }

    conquer(conqueringTeam, alphaTickets, bravoTickets, currentAlphaBunker, currentBravoBunker, sabotaging) {
        this.pushEvent(TTW_EVENTS.BUNKER_CONQUER, {
            discordId: this.translatePlayerNameToDiscordId(this.currentGeneral),
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
                logger.log.info(`${playerName} (${hwid}) not found in HWID map, asking to auth and kicking in ${NOT_AUTHED_KICK_TIMER_SECONDS} seconds`)

                this.soldatClient.messagePlayer(playerName, "You are currently not authenticated. Please type !auth in the gather channel. " +
                    `Kicking in ${NOT_AUTHED_KICK_TIMER_SECONDS} seconds.`)

                this.kickTimers[playerName] = setTimeout(() => {
                    this.soldatClient.kickPlayer(playerName)
                }, NOT_AUTHED_KICK_TIMER_SECONDS * 1000)
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
    Gather, IN_GAME_STATES, TTW_CLASSES, TTW_EVENTS, getClassById
}

