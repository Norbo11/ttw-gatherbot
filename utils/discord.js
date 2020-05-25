const logger = require("./logger")

discordState = {
    discordChannel: undefined,
}

teamEmoji = (teamName) => {
    if (teamName === "Alpha") {
        return ":a:"
    } else if (teamName === "Bravo") {
        return ":regional_indicator_b:"
    } else {
        logger.log.error(`Invalid team name ${teamName}`)
    }

}

module.exports = {
    discordState, teamEmoji
}