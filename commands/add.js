const state = require("../state/state.js")

module.exports = {
    aliases: ['add'],
    description: 'Add yourself to the gather queue.',
    execute(client, message, args) {
        if (!state.currentQueue.includes(message.author)) {
            state.currentQueue.push(message.author)
        }
        state.displayQueue(message)
    },
};
