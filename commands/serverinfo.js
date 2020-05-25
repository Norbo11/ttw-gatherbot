const soldat = require("../utils/soldat")
const logger = require("../utils/logger")
const utils = require("../utils/commandUtils")

module.exports = {
    aliases: ["serverinfo"],
    description: "Get detailed information about the server.",
    execute(client, message, args) {
        utils.displayServerInfo(message)
    },
};
