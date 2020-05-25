const _ = require("lodash")
const logger = require("./logger")
const discord = require("./discord")
const soldat = require("./soldat")
const constants = require("../constants")
const random = require("./random")

MAPS_LIST = [
    "ttw_42ndWood.pms", "ttw_Borderwars.pms", "ttw_Concrete.pms", "ttw_Forgotten.pms", "ttw_Junkyard.pms", "ttw_Mudder.pms", "ttw_rime.pms", "ttw_Take.pms", "ttw_Village.pms",
    "ttw_Afrique.pms", "ttw_Bridge.pms", "ttw_crater.pms", "ttw_Fort.pms", "ttw_kaibatsu.pms", "ttw_Myst2.pms", "ttw_Rime.pms", "ttw_Tenshin2.pms", "ttw_Waste.pms",
    "ttw_afterGlory.pms", "ttw_cadet.pms", "ttw_crecent.pms", "ttw_fortress.pms", "ttw_kamiquasi.pms", "ttw_Myst.pms", "ttw_Tenshin.pms", "ttw_WIP.pms",
    "ttw_Alize.pms", "ttw_Caen.pms", "ttw_Creek.pms", "ttw_Frostbite.pms", "ttw_Kampfer.pms", "ttw_NewNature.pms", "ttw_rover.pms", "ttw_Teroya.pms", "ttw_Ypres-fix.pms",
    "ttw_alphathing.pms", "ttw_Cangaceiros.pms", "ttw_crimson.pms", "ttw_frost.pms", "ttw_Krath.pms", "ttw_Nomans.pms", "ttw_shaft.pms", "ttw_tower.pms",
    "ttw_Anoxi.pms", "ttw_cannibals.pms", "ttw_Dawn.pms", "ttw_generic.pms", "ttw_Limbo.pms", "ttw_nworld.pms", "ttw_Skybridge.pms", "ttw_Toxic.pms",
    "ttw_art.pms", "ttw_castle.pms", "ttw_desert.pms", "ttw_Gloryhill.pms", "ttw_marsh.pms", "ttw_paperwar.pms", "ttw_Skyscrapers.pms", "ttw_Trainyards.pms", "ttw_Ypres_n.pms",
    "ttw_Autumn.pms", "ttw_Cathedral.pms", "ttw_Drain.pms", "ttw_Grasshill.pms", "ttw_meteorite.pms", "ttw_Pinewood.pms", "ttw_SoldiersFoly.pms", "ttw_Untitled3.pms", "ttw_Ypres.pms",
    "ttw_Bachvu.pms", "ttw_ColdMorning.pms", "ttw_El_Alamein.pms", "ttw_hue.pms", "ttw_Mound", "Kopia.pms", "ttw_Plat.pms", "ttw_storm.pms", "ttw_Valley.pms",
    "ttw_BattleField.pms", "ttw_ColdMorning.PMS.old", "ttw_Forest.pms", "ttw_Junkyard2.pms", "ttw_Mound.pms", "ttw_Rage.pms", "ttw_Struggle.pms", "ttw_Verdun.pms"
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

