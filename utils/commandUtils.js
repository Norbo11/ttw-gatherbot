const gather = require("./gather")
const logger = require("./logger")


displayGatherStatus = (message, alphaTickets, bravoTickets, alphaCaps, bravoCaps) => {
    // TODO: This might need different logic

    if (alphaTickets === 500 && bravoTickets === 500 && alphaCaps === 0 && bravoCaps === 0) {
        message.channel.send({
            embed: {
                color: 0xff0000,
                description: "No gather in progress!",
            }
        });
    } else {
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
    }
}


displayServerInfo = (message, serverInfo) => {
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

        if (playerTeam === 0) {
            alphaPlayerStrings.push(`${playerName}: ${playerKills} kills`)
        }
        if (playerTeam === 1) {
            bravoPlayerStrings.push(`${playerName}: ${playerKills} kills`)
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
}

module.exports = {
    displayGatherStatus, displayServerInfo
}

