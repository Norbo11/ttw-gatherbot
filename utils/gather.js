const _ = require("lodash")
const logger = require("./logger")
const discord = require("./discord")
const constants = require("../constants")
const random = require("./random")

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
    "NO_GATHER": "NO_GATHER",
    "GATHER_PRE_RESET": "GATHER_PRE_RESET",
    "GATHER_STARTED": "GATHER_STARTED",
}

const TTW_CLASSES = {
    GENERAL: {
        name: "GENERAL",
        aliases: ["GENERAL", "GEN"]
    },
    RADIOMAN: {
        name: "RADIOMAN",
        aliases: ["RADIOMAN", "RAD"]
    },
    SABOTEUR: {
        name: "SABOTEUR",
        aliases: ["SABOTEUR", "SABO"]
    },
    LONG_RANGE_INFANTRY: {
        name: "LONG_RANGE_INFANTRY",
        aliases: ["LRI"]
    },
    SHORT_RANGE_INFANTRY: {
        name: "SHORT_RANGE_INFANTRY",
        aliases: ["SRI"]
    },
    SPY: {
        name: "SPY",
        aliases: ["SPY"]
    },
    ELITE: {
        name: "ELITE",
        aliases: ["ELITE"]
    },
    ARTILLERY: {
        name: "ARTILLERY",
        aliases: ["ARTILLERY", "ART"]
    },
    ENGINEER: {
        name: "ENGINEER",
        aliases: ["ENGINEER", "ENG"]
    }
}

const TTW_EVENTS = {
    PLAYER_CLASS_SWITCH: "PLAYER_CLASS_SWITCH",
    FLAG_CAP: "FLAG_CAP",
    GATHER_PAUSE: "GATHER_PAUSE",
    GATHER_UNPAUSE: "GATHER_UNPAUSE",
    BUNKER_CONQUER: "BUNKER_CONQUER"
    PLAYER_KILL: "PLAYER_KILL"
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

    constructor(soldatClient, discordChannel) {
        this.soldatClient = soldatClient
        this.discordChannel = discordChannel
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
        return this.inGameState !== IN_GAME_STATES["NO_GATHER"]
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

        const password = Math.random().toString(36).substring(7);

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

        this.discordChannel.send({
            embed: {
                title: "Gather Started",
                color: 0xff0000,
                description: `Size ${size} gather started on **${mapName}**. GLHF!`
            }
        })
    }

    flagCap(playerName, teamName) {
        this.pushEvent(TTW_EVENTS.FLAG_CAP, {
            playerName, teamName
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
        this.events.push({
            type: eventType,
            timestamp: Date.now(),
            ...eventBody
        })
    }

    playerCommand(playerName, currentClass, command) {
        const matchingClass = _.find(TTW_CLASSES, (ttwClass) => ttwClass.aliases.includes(command.toUpperCase()))

        if (matchingClass !== undefined) {
            this.pushEvent(TTW_EVENTS.PLAYER_CLASS_SWITCH, {
                playerName,
                oldClass: currentClass,
                newClass: matchingClass.name,
            })

            if (matchingClass === TTW_CLASSES.GENERAL) {
                this.currentGeneral = playerName
            }

            if (matchingClass === TTW_CLASSES.RADIOMAN) {
                this.currentRadioman = playerName
            }
        }
    }

    conquer(conqueringTeam, alphaTickets, bravoTickets, currentAlphaBunker, currentBravoBunker, sabotaging) {
        this.pushEvent(TTW_EVENTS.BUNKER_CONQUER, {
            playerName: this.currentGeneral,
            conqueringTeam,
            alphaTickets,
            bravoTickets,
            currentAlphaBunker,
            currentBravoBunker,
            sabotaging
        })
    }
}

module.exports = {
    Gather, IN_GAME_STATES, TTW_CLASSES, TTW_EVENTS
}

