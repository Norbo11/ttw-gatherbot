const soldat = require("../utils/soldat")
const logger = require("../utils/logger")
const utils = require("../utils/commandUtils")

module.exports = {
    aliases: ["gatherstatus"],
    description: "Check the current status of the gather.",
    execute(client, message, args) {
        soldat.getGatherStatus((alphaTickets, bravoTickets, alphaCaps, bravoCaps) =>
            utils.displayGatherStatus(message, alphaTickets, bravoTickets, alphaCaps, bravoCaps)
        )
    },
};
