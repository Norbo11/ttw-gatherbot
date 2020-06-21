const logger = require("../utils/logger")
const utils = require("../utils/commandUtils")

module.exports = {
    aliases: ["mappreviews"],
    description: "See how all the maps look like.",
    execute(client, message, args) {
        message.reply("https://soldat-ttw.com/mappreviews.jpg")
    },
};
