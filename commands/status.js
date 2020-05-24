const gather = require("../utils/gather.js")

module.exports = {
    aliases: ['status'],
    description: 'View the current gather queue.',
    execute(client, message, args) {
        gather.displayQueue(message)
    },
};
