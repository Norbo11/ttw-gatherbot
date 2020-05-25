const _ = require("lodash")
const logger = require("../utils/logger")
const discord = require("../utils/discord")

gatherState = {
    currentSize: 6,
    currentQueue: [],
    alphaTeam: [],
    bravoTeam: [],
    gameInProgress: false
}

gatherInProgress = () => {
    return gatherState.gameInProgress
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
                {
                    name: "Map",
                    value: `${serverInfo["mapName"]}`,
                }
            ]
        }
    })
}

getPlayerStrings = () => {
    const alphaPlayersString = gatherState.alphaTeam.map(user => `<@${user.id}>`).join(" - ")
    const bravoPlayersString = gatherState.bravoTeam.map(user => `<@${user.id}>`).join(" - ")

    return {alphaPlayersString, bravoPlayersString}
}

startGame = (message) => {
    const shuffledQueue = _.shuffle(gatherState.currentQueue)

    const alphaPlayers = _.slice(shuffledQueue, 0, gatherState.currentSize / 2)
    const bravoPlayers = _.slice(shuffledQueue, gatherState.currentSize / 2, gatherState.currentSize)

    gatherState.alphaTeam = alphaPlayers
    gatherState.bravoTeam = bravoPlayers
    gatherState.gameInProgress = true

    const {alphaPlayersString, bravoPlayersString} = getPlayerStrings()

    message.channel.send({
        embed: {
            title: "Gather Info",
            color: 0xff0000,
            fields: [
                {
                    name: "Alpha Team",
                    value: `${discord.teamEmoji("Alpha")}: ${alphaPlayersString}`,
                    inline: true
                },
                {
                    name: "Bravo Team",
                    value: `${discord.teamEmoji("Bravo")}: ${bravoPlayersString}`,
                    inline: true
                }
            ]
        }
    })
}

endGame = (alphaTickets, bravoTickets, alphaCaps, bravoCaps) => {
    const {alphaPlayersString, bravoPlayersString} = getPlayerStrings()

    const winningTeam = alphaTickets > bravoTickets ? "Alpha" : "Bravo"
    const losingTeam = alphaTickets > bravoTickets ? "Bravo" : "Alpha"
    const winnerTickets = alphaTickets > bravoTickets ? alphaTickets : bravoTickets
    const loserTickets = alphaTickets > bravoTickets ? bravoTickets : alphaTickets
    const winnerCaps = alphaTickets > bravoTickets ? alphaCaps : bravoCaps
    const loserCaps = alphaTickets > bravoTickets ? bravoCaps : alphaCaps
    const winningPlayersString = alphaTickets > bravoTickets ? alphaPlayersString : bravoPlayersString
    const losingPlayersString = alphaTickets > bravoTickets ? bravoPlayersString : alphaPlayersString

    gatherState.gameInProgress = false
    gatherState.currentQueue = []

    discord.discordState.discordChannel.send({
        embed: {
            title: "Gather End",
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
    discord.discordState.discordChannel.send({
        embed: {
            title: "Gather Start",
            color: 0xff0000,
            description: `Size ${size} gather started on **${mapName}**`
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
    gatherState, gatherInProgress, startGame, displayQueue, endGame, flagCap, gatherPause, gatherUnpause, gatherStart
}

