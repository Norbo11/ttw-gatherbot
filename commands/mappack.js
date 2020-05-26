const logger = require("../utils/logger")
const utils = require("../utils/commandUtils")

module.exports = {
    aliases: ["mappack"],
    description: "Download the TTW map pack.",
    execute(client, message, args) {
        message.reply("https://soldat-ttw.com/ttw_mappack.zip")
    },
};
