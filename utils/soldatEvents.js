const logger = require("./logger")
const soldat = require("./soldat")


PASSIVE_EVENTS = [
    /* Events to process when the gather has already started */
    {
        pattern: /(?<playerName>.*?) scores for (?<teamName>.*?) Team/,
        handler: (gather, match) => gather.flagCap(match.groups["playerName"], match.groups["teamName"]),
        condition: gather => gather.gatherHasStarted()
    },
    {
        pattern: /--- gatherpause/,
        handler: (gather, match) => gather.gatherPause(),
        condition: gather => gather.gatherHasStarted()
    },
    {
        pattern: /--- gatherunpause/,
        handler: (gather, match) => gather.gatherUnpause(),
        condition: gather => gather.gatherHasStarted()
    },
    {
        pattern: /\((?<killerTeam>.*?)\) (?<killerName>.*?) killed \((?<victimTeam>.*?)\) (?<victimName>.*?) with (?<weapon>.*)/,
        handler: (gather, match) =>
            gather.playerKill(
                soldat.TEAMS[match.groups["killerTeam"]],
                match.groups["killerName"],
                soldat.TEAMS[match.groups["victimTeam"]],
                match.groups["victimName"],
                soldat.getWeaponByFormattedName(match.groups["weapon"]),
            ),
        condition: gather => gather.gatherHasStarted()
    },
    {
        pattern: /--- conquer (?<conqueringTeam>.*?) (?<alphaTickets>.*?) (?<bravoTickets>.*?) (?<currentAlphaBunker>.*?) (?<currentBravoBunker>.*?) (?<sabotaging>.*)/,
        handler: (gather, match) =>
            gather.conquer(
                soldat.TEAMS[parseInt(match.groups["conqueringTeam"])],
                parseInt(match.groups["alphaTickets"]),
                parseInt(match.groups["bravoTickets"]),
                parseInt(match.groups["currentAlphaBunker"]),
                parseInt(match.groups["currentBravoBunker"]),
                match.groups["sabotaging"] !== "0"),
        condition: gather => gather.gatherHasStarted()
    },
    /* Events to process when the gather has either started or is in pre-reset mode */
    {
        pattern: /(?<playerName>.*?) has joined (?<teamName>.*?) team/,
        handler: (gather, match) => gather.playerJoin(match.groups["playerName"]),
        condition: gather => gather.gatherInProgress()
    },
    {
        pattern: /(?<playerName>.*?) has left (?<teamName>.*?) team/,
        handler: (gather, match) => gather.playerLeave(match.groups["playerName"]),
        condition: gather => gather.gatherInProgress()
    },
    {
        pattern: /--- gatherstart (?<mapName>.*?) (?<numberOfBunkers>\d*)/,
        handler: (gather, match) => gather.gatherStart(match.groups["mapName"], gather.currentSize, parseInt(match.groups["numberOfBunkers"])),
        condition: gather => gather.gatherInProgress()
    },
    {
        pattern: /--- gatherend (?<alphaTickets>\d*?) (?<bravoTickets>\d*?) (?<alphaCaps>\d*?) (?<bravoCaps>\d*)/,
        handler: (gather, match) => gather.endGame(
            parseInt(match.groups["alphaTickets"]),
            parseInt(match.groups["bravoTickets"]),
            parseInt(match.groups["alphaCaps"]),
            parseInt(match.groups["bravoCaps"])
        ),
        condition: gather => gather.gatherInProgress()
    },
    {
        pattern: /\[CMD\] (?<currentClass>.*?) \((?<playerName>.*?)\): \/(?<command>.*)/,
        handler: (gather, match) => gather.playerCommand(match.groups["playerName"], match.groups["currentClass"], match.groups["command"]),
        condition: gather => gather.gatherInProgress()
    },
    {
        pattern: /<New TTW> (?<playerName>.*?) assigned to task (?<classId>.*)/,
        handler: (gather, match) => gather.playerClassSwitch(match.groups["playerName"], match.groups["classId"]),
        // We need to track class changes even pre-reset, as people might choose their class before the reset.
        condition: gather => gather.gatherInProgress()
    },
    {
        pattern: /\[(?<playerName>.*?)] !say (?<message>.*)/,
        handler: (gather, match) => gather.playerSay(match.groups["playerName"], match.groups["message"]),
        condition: gather => gather.gatherInProgress()
    },
]

registerSoldatEventListeners = (gather, netClient) => {
    logger.log.info("Registered non-command event listeners.")

    netClient.addListener("data", data => {
        const text = data.toString();

        PASSIVE_EVENTS.forEach(eventSpec => {
            let match = text.match(eventSpec.pattern)
            if (match !== null && eventSpec.condition(gather)) {
                try {
                    eventSpec.handler(gather, match)
                } catch (e) {
                    logger.log.error(`There was an error processing passive events from the server: ${e.stack}`)
                }
                logger.log.info(`Received passive event from server: ${text}`)
            }
        })
    });
}

module.exports = {
    registerSoldatEventListeners
}

