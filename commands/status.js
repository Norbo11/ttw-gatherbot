const logger = require("../utils/logger")
const utils = require("../utils/commandUtils")

module.exports = {
    aliases: ["status"],
    description: "View the current gather queue.",
    execute(client, message, args) {
        if (currentGather.gatherInProgress()) {
            utils.displayGatherStatus(message)
        } else {
            utils.displayQueueWithServerInfo(message)
        }
    },
};
