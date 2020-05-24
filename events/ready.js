const gather = require("../utils/gather")
const constants = require("../constants")
const logger = require("../utils/logger")
const discord = require("../utils/discord")

module.exports = client => {
    logger.log.info(`Logged in to Discord server as ${client.user.username}!`)

    const channel = client.channels.get(constants.DISCORD_CHANNEL_ID)
    discord.discordState.discordChannel = channel

    channel.send("Gather bot initialized.")
}
