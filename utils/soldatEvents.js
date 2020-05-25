const gather = require("./gather")
const logger = require("./logger")


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

        let match = text.match(/(?<playerName>.*?) scores for (?<teamName>.*?) Team/)
        if (match !== null) {
            gather.flagCap(match.groups["playerName"], match.groups["teamName"])
        }

        console.log(text)
        match = text.match(/--- gatherend (?<alphaTickets>\d*?) (?<bravoTickets>\d*?) (?<alphaCaps>\d*?) (?<bravoCaps>\d*)/)
        if (match !== null) {
            gather.endGame(match.groups["alphaTickets"], match.groups["bravoTickets"], match.groups["alphaCaps"], match.groups["bravoCaps"])
        }
    });
}

module.exports = {
    registerSoldatEventListeners
}

