const logger = require("../utils/logger")
const utils = require("../utils/commandUtils")
const stats = require("../utils/stats")


module.exports = {
    aliases: ["stats"],
    description: "Show your personal gather statistics.",
    execute(client, message, args) {
        stats.getPlayerStats(currentStatsDb, message.author.id).then((playerStats) => {
            message.channel.send(stats.formatGeneralStatsForPlayer(playerStats))
        })
    },
};
