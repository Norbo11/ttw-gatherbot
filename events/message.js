const constants = require("../constants")
const _ = require("lodash")
const logger = require("../utils/logger")

module.exports = (client, message) => {
    logger.log.info(`Received message: ${message.content}`)

    // Do not process messages that don't start with our prefix, or come from a bot
    if (!message.content.startsWith(constants.PREFIX) || message.author.bot) return;

    logger.log.info(`1: ${message.content}`)

    // Do not process messages that don't come from the designated channel
    if (message.channel !== currentDiscordChannel) return;

    logger.log.info(`2: ${message.content}`)

    const args = message.content.slice(constants.PREFIX.length).split(/ +/);
    const commandText = args.shift().toLowerCase();

    const command = _.find(client.commands, (command) => command.aliases.includes((commandText)))

    if (command === undefined) return;

    try {
        logger.log.info(`${message.author.username}: ${message.content}`)
        command.execute(client, message, args);
    } catch (error) {
        console.error(error);
        message.reply("there was an error trying to execute that command!");
    }
}
