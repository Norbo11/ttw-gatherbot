const logger = require("../utils/logger")
const utils = require("../utils/commandUtils")
const _ = require("lodash")

module.exports = {
    aliases: ["delrematch"],
    description: "Delete yourself from the rematch queue.",
    execute(client, message, args) {
        if (currentGather.gatherInProgress()) {
            message.channel.send("A gather is currently in progress.")
            return
        }

        currentStatsDb.getLastGame().then(lastGame => {
            _.remove(currentGather.rematchQueue, (x) => x === message.author)
            currentGather.displayQueue(lastGame.size, currentGather.rematchQueue, lastGame.mapName, true)
        })
    },
};
