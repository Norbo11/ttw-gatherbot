const state = require("../state/state.js")

module.exports = {
    name: 'add',
    description: 'Add yourself to the gather queue.',
    execute(message, args) {
        if (!state.currentQueue.includes(message.author)) {
            state.currentQueue.push(message.author)
        }
        state.displayQueue(message)
    },
};
