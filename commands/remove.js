const gather = require("../utils/gather.js")
const _ = require("lodash")

module.exports = {
    aliases: ['del', 'remove'],
    description: 'Remove yourself from the gather queue.',
    execute(client, message, args) {
        _.remove(gather.gatherState.currentQueue, (x) => x === message.author)
        gather.displayQueue(message)
    },
};
