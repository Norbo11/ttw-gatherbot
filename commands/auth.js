const logger = require("../utils/logger")
const utils = require("../utils/commandUtils")

module.exports = {
    aliases: ["auth"],
    description: "Authenticate with the bot.",
    execute(client, message, args) {
        const authCode = currentGather.playerDiscordAuth(message.author.id)
        message.author.send(`To authenticate, type this ingame: /auth ${authCode}`)
    },
};
