const gather = require("../utils/gather.js")
const soldat = require("../utils/soldat")
const logger = require("../utils/logger")
const utils = require("../utils/commandUtils")

module.exports = {
    aliases: ["size"],
    description: "Get or set the gather size.",
    execute(client, message, args) {
        if (args.length === 0) {
            message.channel.send(`The current gather size is ${gather.gatherState.currentSize}`)
            return
        }

        if (gather.gatherInProgress()) {
            message.channel.send("A gather is currently in progress.")
            return
        }

        const newSize = parseInt(args[0])

        if (newSize % 2 !== 0) {
            message.channel.send(`The gather size must be a multiple of 2.`)
            return
        }

        message.channel.send("Changing size, hang on...")

        soldat.listenForServerResponse(text => {
            if (text.match(/Initializing bunkers/)) {
                gather.gatherState.currentSize = newSize
                gather.gatherState.currentQueue = []
                return true;
            }
            return false;
        }, () => {
            utils.displayQueueWithServerInfo(message)
        })

        soldat.soldatClient.write(`/gathersize ${newSize}\n`);
        soldat.soldatClient.write("/restart\n");
        soldat.soldatClient.write(`/say Gather size set to ${newSize}\n`);
    },
};
