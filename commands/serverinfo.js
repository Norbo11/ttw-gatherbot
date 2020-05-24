const gather = require("../utils/gather")
const soldat = require("../utils/soldat")
const logger = require("../utils/logger")

module.exports = {
    aliases: ["serverinfo"],
    description: "Get detailed information about the server.",
    execute(client, message, args) {
        soldat.getServerInfo()
    },
};
