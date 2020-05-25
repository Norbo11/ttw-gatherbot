const gather = require("./gather")
const logger = require("./logger")
const soldat = require("./soldat")


displayGatherStatus = (message) => {
    soldat.getGatherStatus((alphaTickets, bravoTickets, alphaCaps, bravoCaps) => {
        message.channel.send({
            embed: {
                color: 0xff0000,
                title: "Gather Info",
                description: `**Gather In Progress**\n` +
                    `:a: **Alpha** - Tickets: ${alphaTickets} - Caps: ${alphaCaps}\n` +
                    `:regional_indicator_b: **Bravo** - Tickets: ${bravoTickets} - Caps: ${bravoCaps}`,
                fields: gather.getPlayerFields()
            }
        });
    })
}


displayServerInfo = (message) => {
    soldat.getServerInfo(serverInfo => {
        const alphaPlayerStrings = []
        const bravoPlayerStrings = []

        for (let i = 0; i < 32; i++) {
            const playerNameLength = serverInfo["names"][i]["playerName"]

            if (playerNameLength === 0) {
                continue
            }

            const playerName = serverInfo["names"][i]["playerName"]
            const playerTeam = serverInfo["teams"][i]["playerTeam"]
            const playerKills = serverInfo["kills"][i]["playerKills"]
            const playerDeaths = serverInfo["deaths"][i]["playerDeaths"]
            const playerPing = serverInfo["pings"][i]["playerPing"]

            if (playerTeam === 0) {
                alphaPlayerStrings.push(`${playerName} (${playerPing}ms): ${playerKills}/${playerDeaths}`)
            }
            if (playerTeam === 1) {
                bravoPlayerStrings.push(`${playerName} (${playerPing}ms): ${playerKills}/${playerDeaths}`)
            }
        }

        logger.log.info(alphaPlayerStrings.join("\n"))
        logger.log.info(bravoPlayerStrings.join("\n"))

        message.channel.send({
            embed: {
                title: "Server Info",
                color: 0xff0000,
                fields: [
                    {
                        name: `Current Map`,
                        value: serverInfo["mapName"],
                    },
                    {
                        name: `Next Map`,
                        value: serverInfo["nextMap"],
                    },
                    {
                        name: `Alpha Team`,
                        value: alphaPlayerStrings.join("\n") ? alphaPlayerStrings.length > 0 : "No players",
                        inline: true
                    },
                    {
                        name: `Bravo Team`,
                        value: bravoPlayerStrings.join("\n") ? bravoPlayerStrings.length > 0 : "No players",
                        inline: true
                    },
                ]
            }
        }).catch(ex => logger.log.error(ex.response))
    })
}


displayQueueWithServerInfo = (message) => {
    soldat.getServerInfo(serverInfo => {
        gather.displayQueue(message, serverInfo)
    })
}

module.exports = {
    displayGatherStatus, displayServerInfo, displayQueueWithServerInfo
}

