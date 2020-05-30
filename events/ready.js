const gather = require("../utils/gather")
const constants = require("../constants")
const logger = require("../utils/logger")
const discord = require("../utils/discord")

module.exports = client => {
    logger.log.info(`Logged in to Discord server as ${client.user.username}!`)

    discord.discordState.discordChannel = client.channels.get(constants.DISCORD_CHANNEL_ID)
}
