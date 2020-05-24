const gather = require("../utils/gather")
const logger = require("../utils/logger")

module.exports = {
    aliases: ["gatherstatus"],
    description: "Check the current status of the gather.",
    execute(client, message, args) {
        gather.getGatherStatus(message)
    },
};
