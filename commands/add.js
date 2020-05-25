const gather = require("../utils/gather.js")
const logger = require("../utils/logger")

module.exports = {
    aliases: ["add"],
    description: "Add yourself to the gather queue.",
    execute(client, message, args) {
        if (gather.gatherState.gameInProgress) {
            message.channel.send("A gather is currently in progress.")
            return
        }

        if (!gather.gatherState.currentQueue.includes(message.author)) {
            gather.gatherState.currentQueue.push(message.author)
        }

        if (gather.gatherState.currentQueue.length === gather.gatherState.currentSize) {
            gather.startGame(message)
        } else {
            gather.displayQueue(message)
        }
    },
};
