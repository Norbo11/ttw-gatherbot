const logger = require("./logger")
const soldat = require("./soldat")


registerSoldatEventListeners = (gather, netClient) => {
    logger.log.info("Registered non-command event listeners.")

    netClient.addListener("data", function (data) {
        const text = data.toString();

        if (!gather.gatherInProgress()) {
            return
        }

        // TODO: Server keeps spamming these messages, should probably silence them
        if (text.startsWith("--- hwid")) {
            return
        }

        let eventText = undefined

        let match = text.match(/(?<playerName>.*?) scores for (?<teamName>.*?) Team/)
        if (match !== null) {
            gather.flagCap(match.groups["playerName"], match.groups["teamName"])
            eventText = text
        }

        match = text.match(/--- gatherstart (?<mapName>.*?) (?<numberOfBunkers>\d*)/)
        if (match !== null) {
            gather.gatherStart(match.groups["mapName"], gather.currentSize, parseInt(match.groups["numberOfBunkers"]))
            eventText = text
        }

        match = text.match(/--- gatherend (?<alphaTickets>\d*?) (?<bravoTickets>\d*?) (?<alphaCaps>\d*?) (?<bravoCaps>\d*)/)
        if (match !== null) {
            gather.endGame(match.groups["alphaTickets"], match.groups["bravoTickets"], match.groups["alphaCaps"], match.groups["bravoCaps"])
            eventText = text
        }

        match = text.match(/--- gatherpause/)
        if (match !== null) {
            gather.gatherPause()
            eventText = text
        }

        match = text.match(/--- gatherunpause/)
        if (match !== null) {
            gather.gatherUnpause()
            eventText = text
        }

        match = text.match(/\[CMD\] (?<currentClass>.*?) \((?<playerName>.*?)\): \/(?<command>.*)/)
        if (match !== null) {
            gather.playerCommand(match.groups["playerName"], match.groups["currentClass"], match.groups["command"])
            eventText = text
        }

        match = text.match(/\((?<killerTeam>.*?)\) (?<killerName>.*?) killed \((?<victimTeam>.*?)\) (?<victimName>.*?) with (?<weapon>.*)/)
        if (match !== null) {
            gather.playerKill(
                soldat.TEAMS[parseInt(match.groups["killerTeam"])],
                match.groups["killerName"],
                soldat.TEAMS[parseInt(match.groups["victimTeam"])],
                match.groups["victimName"],
                match.groups["weapon"]
            )
            eventText = text
        }


        match = text.match(/--- conquer (?<conqueringTeam>.*?) (?<alphaTickets>.*?) (?<bravoTickets>.*?) (?<currentAlphaBunker>.*?) (?<currentBravoBunker>.*?) (?<sabotaging>.*)/)
        if (match !== null) {
            gather.conquer(
                soldat.TEAMS[parseInt(match.groups["conqueringTeam"])],
                parseInt(match.groups["alphaTickets"]),
                parseInt(match.groups["bravoTickets"]),
                parseInt(match.groups["currentAlphaBunker"]),
                parseInt(match.groups["currentBravoBunker"]),
                match.groups["sabotaging"] !== "0")
            eventText = text
        }

        if (eventText !== undefined) {
            logger.log.info(`Received passive event from server: ${eventText}`)
        }
    });
}

module.exports = {
    registerSoldatEventListeners
}

