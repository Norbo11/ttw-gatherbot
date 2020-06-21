const logger = require("./logger")
const moment = require("moment")
const stats = require("../utils/stats")

teamEmoji = (teamName) => {
    if (teamName === "Alpha") {
        return ":a:"
    } else if (teamName === "Bravo") {
        return ":regional_indicator_b:"
    } else {
        logger.log.error(`Invalid team name ${teamName}`)
    }
}

getPlayerStrings = (alphaTeamIds, bravoTeamIds, delim = "\n") => {
    const alphaPlayersString = alphaTeamIds.length > 0 ? alphaTeamIds.map(id => `<@${id}>`).join(delim) : "No players"
    const bravoPlayersString = bravoTeamIds.length > 0 ? bravoTeamIds.map(id => `<@${id}>`).join(delim) : "No players"

    return {alphaPlayersString, bravoPlayersString}
}

getPlayerFields = (alphaTeamIds, bravoTeamIds) => {
    const {alphaPlayersString, bravoPlayersString} = getPlayerStrings(alphaTeamIds, bravoTeamIds)

    return [
        {
            name: `${teamEmoji("Alpha")} Alpha Team`,
            value: `${alphaPlayersString}`,
            inline: true
        },
        {
            name: `${teamEmoji("Bravo")} Bravo Team`,
            value: `${bravoPlayersString}`,
            inline: true
        }
    ];
}

getGatherLengthField = (startTime, endTime, inline = false) => {
    const momentDuration = moment.duration(endTime - startTime)
    return {
        name: "Gather Duration",
        value: momentDuration.humanize(),
        inline
    }
}

getMapField = (mapName, inline = false) => {
    return {
        name: "Map",
        value: `${mapName}`,
        inline,
    }
}

getGatherEndFields = (game) => {
    return [
        getGatherLengthField(game.startTime, game.endTime, true),
        getMapField(game.mapName, true),
        ...getWinnerAndLoserFields(
            game.alphaTickets,
            game.bravoTickets,
            stats.getTeamCaps(game.events, "Alpha"),
            stats.getTeamCaps(game.events, "Bravo"),
            game.alphaPlayers,
            game.bravoPlayers
        )
    ]
}

getServerLinkField = (password = "") => {
    return {
        name: "Link",
        value: `soldat://${process.env.SERVER_IP}:${process.env.SERVER_PORT}/${password}`,
    }
}

getWinnerAndLoserFields = (alphaTickets, bravoTickets, alphaCaps, bravoCaps, alphaDiscordIds, bravoDiscordIds) => {
    const {alphaPlayersString, bravoPlayersString} = getPlayerStrings(
        alphaDiscordIds,
        bravoDiscordIds,
        " - "
    )

    const winningTeam = alphaTickets > bravoTickets ? "Alpha" : "Bravo"
    const losingTeam = alphaTickets > bravoTickets ? "Bravo" : "Alpha"
    const winnerTickets = alphaTickets > bravoTickets ? alphaTickets : bravoTickets
    const loserTickets = alphaTickets > bravoTickets ? bravoTickets : alphaTickets
    const winnerCaps = alphaTickets > bravoTickets ? alphaCaps : bravoCaps
    const loserCaps = alphaTickets > bravoTickets ? bravoCaps : alphaCaps
    const winningPlayersString = alphaTickets > bravoTickets ? alphaPlayersString : bravoPlayersString
    const losingPlayersString = alphaTickets > bravoTickets ? bravoPlayersString : alphaPlayersString

    return [
        {
            name: `**Winning Team (${winnerTickets} tickets left) (${winnerCaps} caps)**`,
            value: `${teamEmoji(winningTeam)}: ${winningPlayersString}`,
        },
        {
            name: `Losing Team (${loserTickets} tickets left) (${loserCaps} caps)`,
            value: `${teamEmoji(losingTeam)}: ${losingPlayersString}`,
        },
    ]
}


module.exports = {
    teamEmoji, getPlayerStrings, getPlayerFields, getWinnerAndLoserFields, getGatherLengthField, getGatherEndFields,
    getMapField, getServerLinkField
}