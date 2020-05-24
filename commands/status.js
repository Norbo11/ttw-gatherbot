const gather = require("../utils/gather.js")
const logger = require("../utils/logger")

module.exports = {
    aliases: ["status"],
    description: "View the current gather queue.",
    execute(client, message, args) {
        if (gather.gatherInProgress()) {
            gather.getGatherStatus(message)
        } else {
            gather.displayQueue(message)
        }
    },
};
