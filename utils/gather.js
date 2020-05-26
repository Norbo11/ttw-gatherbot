const _ = require("lodash")
const logger = require("./logger")
const discord = require("./discord")
const soldat = require("./soldat")
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


gatherState = {
    currentSize: 6,
    currentQueue: [],
    alphaTeam: [],
    bravoTeam: [],
    inGameState: IN_GAME_STATES["NO_GATHER"]
}

getPlayerStrings = (delim = "\n") => {
    const alphaPlayersString = gatherState.alphaTeam.length > 0 ? gatherState.alphaTeam.map(user => `<@${user.id}>`).join(delim) : "No players"
    const bravoPlayersString = gatherState.bravoTeam.length > 0 ? gatherState.bravoTeam.map(user => `<@${user.id}>`).join(delim) : "No players"

    return {alphaPlayersString, bravoPlayersString}
}

getPlayerFields = () => {
    const {alphaPlayersString, bravoPlayersString} = getPlayerStrings()

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

getMapField = (mapName) => {
    return {
        name: "Map",
        value: `${mapName}`,
    }
}

getServerLinkField = (password = "goaway") => {
    return {
        name: "Link",
        value: `soldat://${constants.SERVER_IP}:${constants.SERVER_PORT}/${password}`,
    }
}

gatherInProgress = () => {
    return gatherState.inGameState !== IN_GAME_STATES["NO_GATHER"]
}

displayQueue = (message, serverInfo) => {
    const queueMembers = gatherState.currentQueue.map(user => `<@${user.id}>`)
    for (let i = 0; i < gatherState.currentSize - gatherState.currentQueue.length; i++) {
        queueMembers.push(":bust_in_silhouette:")
    }

    message.channel.send({
        embed: {
            title: "Gather Info",
            color: 0xff0000,
            fields: [
                {
                    name: "Current Queue",
                    value: `${queueMembers.join(" - ")}`
                },
                getMapField(serverInfo["mapName"])
            ]
        }
    })
}

startGame = (message) => {
    const shuffledQueue = _.shuffle(gatherState.currentQueue)

    const alphaPlayers = _.slice(shuffledQueue, 0, gatherState.currentSize / 2)
    const bravoPlayers = _.slice(shuffledQueue, gatherState.currentSize / 2, gatherState.currentSize)

    gatherState.alphaTeam = alphaPlayers
    gatherState.bravoTeam = bravoPlayers
    gatherState.inGameState = IN_GAME_STATES["GATHER_PRE_RESET"]

    const password = Math.random().toString(36).substring(7);

    soldat.setServerPassword(password, () => {
        soldat.getServerInfo(serverInfo => {
            console.log(serverInfo["mapName"])

            shuffledQueue.forEach(user => {
                user.send({
                    embed: {
                        title: "Gather Started",
                        color: 0xff0000,
                        fields: [getServerLinkField(password), ...getPlayerFields(), getMapField(serverInfo["mapName"])]
                    }
                })
            })

            message.channel.send({
                embed: {
                    title: "Gather Started",
                    color: 0xff0000,
                    fields: [...getPlayerFields(), getMapField(serverInfo["mapName"])]
                }
            })
        })
    })
}

endGame = (alphaTickets, bravoTickets, alphaCaps, bravoCaps) => {
    const {alphaPlayersString, bravoPlayersString} = getPlayerStrings(" - ")

    const winningTeam = alphaTickets > bravoTickets ? "Alpha" : "Bravo"
    const losingTeam = alphaTickets > bravoTickets ? "Bravo" : "Alpha"
    const winnerTickets = alphaTickets > bravoTickets ? alphaTickets : bravoTickets
    const loserTickets = alphaTickets > bravoTickets ? bravoTickets : alphaTickets
    const winnerCaps = alphaTickets > bravoTickets ? alphaCaps : bravoCaps
    const loserCaps = alphaTickets > bravoTickets ? bravoCaps : alphaCaps
    const winningPlayersString = alphaTickets > bravoTickets ? alphaPlayersString : bravoPlayersString
    const losingPlayersString = alphaTickets > bravoTickets ? bravoPlayersString : alphaPlayersString

    gatherState.inGameState = IN_GAME_STATES["NO_GATHER"]
    gatherState.currentQueue = []

    soldat.changeMap(MAPS_LIST[random.getRandomInt(0, MAPS_LIST.length)])

    discord.discordState.discordChannel.send({
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

gatherStart = (mapName, size) => {
    gatherState.inGameState = IN_GAME_STATES["GATHER_STARTED"]

    discord.discordState.discordChannel.send({
        embed: {
            title: "Gather Started",
            color: 0xff0000,
            description: `Size ${size} gather started on **${mapName}**. GLHF!`
        }
    })
}

flagCap = (playerName, teamName) => {
    discord.discordState.discordChannel.send({
        embed: {
            title: `${teamName} cap`,
            color: 0xff0000,
            description: `**${playerName}** scored for the **${teamName}** team!`
        }
    })
}

gatherPause = () => {
    discord.discordState.discordChannel.send({
        embed: {
            title: `Gather Paused`,
            color: 0xff0000,
        }
    })
}

gatherUnpause = () => {
    discord.discordState.discordChannel.send({
        embed: {
            title: `Gather Unpaused`,
            color: 0xff0000,
            description: "GO GO GO"
        }
    })
}

module.exports = {
    gatherState, gatherInProgress, startGame, displayQueue, endGame, flagCap, gatherPause, gatherUnpause,
    gatherStart, getPlayerFields, IN_GAME_STATES, getServerLinkField, getMapField
}

