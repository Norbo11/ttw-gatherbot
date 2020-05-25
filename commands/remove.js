const gather = require("../utils/gather")
const _ = require("lodash")
const logger = require("../utils/logger")
const utils = require("../utils/commandUtils")

module.exports = {
    aliases: ["del", "remove"],
    description: "Remove yourself from the gather queue.",
    execute(client, message, args) {
        if (gather.gatherInProgress()) {
            message.channel.send("A gather is currently in progress.")
            return
        }

        _.remove(gather.gatherState.currentQueue, (x) => x === message.author)
        utils.displayQueueWithServerInfo(message)
    },
};
