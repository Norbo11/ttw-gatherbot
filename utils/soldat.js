const net = require("net")
const constants = require("../constants")
const logger = require("../utils/logger")
const discord = require("../utils/discord")

logger.log.info(`Attempting admin connection with Soldat Server at ${constants.SERVER_IP}:${constants.SERVER_PORT}/${constants.SERVER_ADMIN_PASSWORD}`)

registerSoldatEventListeners = (soldatClient) => {
    logger.log.info("Registered non-command event listeners.")

    soldatClient.addListener("data", function (data) {
        const text = data.toString();

        // TODO: Server keeps spamming these messages, should probably silence them
        if (text.startsWith("--- hwid")) {
            return;
        }

        logger.log.info(`Received from server: ${text.trim()}`)

        if (text.match(/USER RESET, GATHER RESTART!/)) {
            soldatClient.write("/say ggwp\n");
        }

        const match = text.match(/(?<playerName>.*?) scores for (?<teamName>.*?) Team/)
        if (match !== null) {
            discord.discordState.discordChannel.send(`${match.groups["playerName"]} scored for the ${match.groups["teamName"]} team!`)
        }
    });
}

const soldatClient = net.connect(constants.SERVER_PORT, constants.SERVER_IP, function () {
    soldatClient.write(`${constants.SERVER_ADMIN_PASSWORD}\n`)
    logger.log.info("Successfully connected to the Soldat server.")

    registerSoldatEventListeners(soldatClient)
})

listenForServerResponse = (processData) => {

    const listener = (data) => {
        const read = data.toString();
        logger.log.info(`Received from server: ${read.trim()}`)
        if (processData(read)) {
            logger.log.info("Got the data that we wanted, removing listener.")
            soldatClient.removeListener("data", listener)
        }
    }

    soldatClient.addListener("data", listener)

    setTimeout(() => {
        logger.log.info("7 seconds have passed, removing listener.")
        soldatClient.removeListener("data", listener)
    }, 7000)
}

module.exports = {
    soldatClient, listenForServerResponse
}
