const net = require("net")
const constants = require("../constants")
const logger = require("../utils/logger")
const discord = require("../utils/discord")
const soldatEvents = require("../utils/soldatEvents")
const Parser = require("binary-parser").Parser

logger.log.info(`Attempting admin connection with Soldat Server at ${constants.SERVER_IP}:${constants.SERVER_PORT}/${constants.SERVER_ADMIN_PASSWORD}`)

const soldatClient = net.connect(constants.SERVER_PORT, constants.SERVER_IP, function () {
    soldatClient.write(`${constants.SERVER_ADMIN_PASSWORD}\n`)
    logger.log.info("Successfully connected to the Soldat server.")

    soldatEvents.registerSoldatEventListeners(soldatClient)
})

listenForServerResponse = (processData, callback = () => {}) => {

    const listener = (data) => {
        const read = data.toString();
        logger.log.info(`Received from server: ${read.trim()}`)
        if (processData(read)) {
            logger.log.info("Got the data that we wanted, removing listener.")
            soldatClient.removeListener("data", listener)
            callback()
        }
    }

    soldatClient.addListener("data", listener)

    setTimeout(() => {
        logger.log.info("7 seconds have passed, removing listener.")
        soldatClient.removeListener("data", listener)
    }, 7000)
}

const soldatRefreshxParser = new Parser()
    .string("refreshx", {
        length: 10,
        stripNull: true
    })
    .array("names", {
        length: 32,
        type: new Parser()
            .uint8("playerNameLength")
            .string("playerName", {
                length: 24,
                stripNull: true,
            })
    })
    .array("hwids", {
        length: 32,
        type: new Parser()
            .string("hwid", {
                length: 12,
                stripNull: true,
            })
    })
    .array("teams", {
        length: 32,
        type: new Parser()
            .int8("playerTeam")
    })
    .array("kills", {
        length: 32,
        type: new Parser()
            .uint16("playerKills")
    })
    .array("caps", {
        length: 32,
        type: new Parser()
            .uint8("playerCaps")
    })
    .array("deaths", {
        length: 32,
        type: new Parser()
            .uint16("playerDeaths")
    })
    .array("pings", {
        length: 32,
        type: new Parser()
            .uint32("playerPing")
    })
    .array("ids", {
        length: 32,
        type: new Parser()
            .uint8("playerId")
    })
    .array("ips", {
        length: 32,
        type: new Parser()
            .int32("playerIp")
    })
    .array("xLocations", {
        length: 32,
        type: new Parser()
            .floatbe("playerX")
    })
    .array("yLocations", {
        length: 32,
        type: new Parser()
            .floatbe("playerY")
    })
    .floatbe("redFlagXLocation")
    .floatbe("redFlagYLocation")
    .floatbe("blueFlagXLocation")
    .floatbe("blueFlagYLocation")
    .array("teamScores", {
        length:4,
        type: new Parser()
            .uint16("score")
    })
    .seek(1)
    .string("mapName", {
        length: 16,
        stripNull: true,
    })
    .uint32("timeLimit")
    .uint32("timeLeft")
    .uint16("scoreLimit")
    .uint8("gameStyle")
    .uint8("maxPlayers")
    .uint8("maxSpectators")
    .uint8("gamePassworded")
    .seek(1)
    .string("nextMap", {
        length: 16,
        stripNull: true,
    })


getServerInfo = (callback) => {
    const listener = (data) => {
        if (data.toString().startsWith("REFRESHX")) {
            const parsedInfo = soldatRefreshxParser.parse(data)

            console.log(parsedInfo)

            soldatClient.removeListener("data", listener)
            callback(parsedInfo)
        }
    }

    soldatClient.addListener("data", listener)
    soldatClient.write("REFRESHX\n")

    setTimeout(() => {
        logger.log.info("7 seconds have passed, removing listener.")
        soldatClient.removeListener("data", listener)
    }, 7000)
}


getGatherStatus = (callback) => {
    soldatClient.listenForServerResponse(text => {
        const parts = text.split(" ")

        if (parts[0] !== "---") {
            return false;
        }

        const alphaTickets = parseInt(parts[2])
        const bravoTickets = parseInt(parts[3])

        const alphaCaps = parseInt(parts[4])
        const bravoCaps = parseInt(parts[5])

        callback(alphaTickets, bravoTickets, alphaCaps, bravoCaps)
        return true;
    });

    soldatClient.write("=== status\n");
}


module.exports = {
    soldatClient, listenForServerResponse, getServerInfo, getGatherStatus
}
