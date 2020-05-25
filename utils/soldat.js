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

/* This is the single function that we should use to fetch data from the server. It attaches a temporary listener
 * to the server socket, and awaits some user-specified condition to be true. It then calls a provided callback
 * function with the fetched result and removes the temporary listener. If the condition isn't met within the
 * specified timeout, the listener is also removed. The point of this is to "actively" listen for some data to come
 * back from the server when a particular command is being performed, such as changing the map, but only for a short
 * period of time. This differs from "passive" listeners defined inside soldatEvent.js that continuously listen to
 * events, such as gather end, caps, etc.
 *
 * @param processData: A function that receives data from the server and returns some result, or false if the data
 * we wanted wasn't found.
 *
 * @param callback: A function that gets called with the resulting data once it's found.
 *
 * @param raw: If true, will pass raw bytes as received by the server. Otherwise will convert raw bytes into string
 * format first.
 *
 * @param timeout: How long should we wait for the server to send the data we want, as defined by the processData
 * function. Defaults to 7 seconds.
 */
listenForServerResponse = (processData,
                           callback = () => {},
                           raw = false,
                           timeout = 7000) => {
    const listener = (data) => {
        if (!raw) {
            data = data.toString()
            logger.log.info(`Received active raw event from server: ${data.trim()}`)
        }

        logger.log.info(`Received active event from server: ${data}`)

        const result = processData(data)

        if (result !== undefined && result !== false) {
            logger.log.info("Got the data that we wanted, removing listener.")

            soldatClient.removeListener("data", listener)
            callback(result)
        }
    }

    soldatClient.addListener("data", listener)

    // TODO: Currently this removal happens even if the data is found. The extra logging message is okay for now.
    setTimeout(() => {
        logger.log.info(`${timeout}ms has passed, removing listener.`)
        soldatClient.removeListener("data", listener)
    }, timeout)
}


// This is a parser used to parse the output of the REFRESHX command: https://wiki.soldat.pl/index.php/Refreshx
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
            .uint16le("playerKills")
    })
    .array("caps", {
        length: 32,
        type: new Parser()
            .uint8("playerCaps")
    })
    .array("deaths", {
        length: 32,
        type: new Parser()
            .uint16le("playerDeaths")
    })
    .array("pings", {
        length: 32,
        type: new Parser()
            .uint32le("playerPing")
    })
    .array("ids", {
        length: 32,
        type: new Parser()
            .uint8("playerId")
    })
    .array("ips", {
        length: 32,
        type: new Parser()
            .int32le("playerIp")
    })
    .array("xLocations", {
        length: 32,
        type: new Parser()
            .floatle("playerX")
    })
    .array("yLocations", {
        length: 32,
        type: new Parser()
            .floatle("playerY")
    })
    .floatbe("redFlagXLocation")
    .floatbe("redFlagYLocation")
    .floatbe("blueFlagXLocation")
    .floatbe("blueFlagYLocation")
    .array("teamScores", {
        length: 4,
        type: new Parser()
            .uint16le("score")
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
    logger.log.info("Getting server info using REFRESHX...")

    listenForServerResponse(data => {
        const stringData = data.toString()
        const refreshXIndex = stringData.indexOf("REFRESHX")

        if (refreshXIndex !== -1) {
            data = data.slice(refreshXIndex, data.length)
            const parsedInfo = soldatRefreshxParser.parse(data)
            logger.log.info("Received and parsed data from REFRESHX")
            return parsedInfo
        }
        return false
    }, callback, true)

    soldatClient.write("REFRESHX\n")
}


getGatherStatus = (callback) => {
    listenForServerResponse(text => {
        const parts = text.split(" ")

        if (parts[0] !== "---") {
            return false
        }

        if (parts[1] !== "status") {
            return false
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


setServerPassword = (password, callback) => {
    logger.log.info(`Setting server password to ${password}`)

    listenForServerResponse(text => {
        return text.match(/Server password changed to .*/);
    }, callback);

    soldatClient.write(`/password ${password}\n`);
}

changeMap = (mapName, callback) => {
    discord.discordState.discordChannel.send("Changing map, hang on...")

    listenForServerResponse(text => {
        if (text.match(/Map not found/)) {
            return "not_found";
        }

        if (text.match(/Initializing bunkers/)) {
            return "found";
        }

        return false;
    }, callback)

    soldatClient.write(`/map ${mapName}\n`);
}

module.exports = {
    soldatClient, listenForServerResponse, getServerInfo, getGatherStatus, setServerPassword, changeMap
}
