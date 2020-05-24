const gather = require("../utils/gather")
const _ = require("lodash")
const logger = require("../utils/logger")

module.exports = {
    aliases: ["del", "remove"],
    description: "Remove yourself from the gather queue.",
    execute(client, message, args) {
        _.remove(gather.gatherState.currentQueue, (x) => x === message.author)
        gather.displayQueue(message)
    },
};
