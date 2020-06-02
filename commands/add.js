const logger = require("../utils/logger")
const utils = require("../utils/commandUtils")

module.exports = {
    aliases: ["add"],
    description: "Add yourself to the gather queue.",
    execute(client, message, args) {
        if (currentGather.gatherInProgress()) {
            message.channel.send("A gather is currently in progress.")
            return
        }

        if (!currentGather.currentQueue.includes(message.author)) {
            currentGather.currentQueue.push(message.author)

            if (currentGather.currentQueue.length === currentGather.currentSize) {
                currentGather.startGame(message)
            } else {
                utils.displayQueueWithServerInfo(message)
            }
        }
    },
};
