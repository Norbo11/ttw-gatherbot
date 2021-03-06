const logger = require("../utils/logger")
const utils = require("../utils/commandUtils")
const stats = require("../utils/stats")


module.exports = {
    aliases: ["gatherstats"],
    description: "Show overall gather statistics.",
    execute(client, message, args) {
        stats.getGatherStats(currentStatsDb).then((gatherStats) => {
            message.channel.send(stats.formatGatherStats(gatherStats))
        })
    },
};
