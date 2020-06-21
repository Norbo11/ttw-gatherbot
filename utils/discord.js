const logger = require("./logger")

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


module.exports = {
    teamEmoji, getPlayerStrings, getPlayerFields
}