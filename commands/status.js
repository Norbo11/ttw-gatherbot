const soldat = require("../utils/soldat")
const logger = require("../utils/logger")
const utils = require("../utils/commandUtils")
const gather = require("../utils/gather")

module.exports = {
    aliases: ["status"],
    description: "View the current gather queue.",
    execute(client, message, args) {
        if (gather.gatherInProgress()) {
            soldat.getGatherStatus((alphaTickets, bravoTickets, alphaCaps, bravoCaps) =>
                utils.displayGatherStatus(message, alphaTickets, bravoTickets, alphaCaps, bravoCaps)
            )
        } else {
            gather.displayQueue(message)
        }
    },
};
