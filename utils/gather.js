const _ = require("lodash")
const soldat = require("./soldat")
const logger = require("../utils/logger")

gatherState = {
    currentSize: 6,
    currentQueue: [],
    currentMap: "ttw_test",
    alphaTeam: [],
    bravoTeam: []
}

gatherInProgress = () => {
    return gatherState.currentSize === gatherState.currentQueue.length
}

displayQueue = (message) => {
    const queueMembers = gatherState.currentQueue.map(user => `<@${user.id}>`)
    for (let i = 0; i < gatherState.currentSize - gatherState.currentQueue.length; i++) {
        queueMembers.push(":bust_in_silhouette:")
    }
    message.channel.send(`[${queueMembers.join(" - ")}] [${gatherState.currentMap}]`)
}

getPlayerFields = () => {
    const alphaPlayersString = gatherState.alphaTeam.map(user => `<@${user.id}>`).join(" - ")
    const bravoPlayersString = gatherState.bravoTeam.map(user => `<@${user.id}>`).join(" - ")

    return [
        {
            name: "Alpha",
            value: `:a:: ${alphaPlayersString}`,
            inline: true
        },
        {
            name: "Bravo",
            value: `:regional_indicator_b:: ${bravoPlayersString}`,
            inline: true
        }
    ]
}

startGame = (message) => {
    const shuffledQueue = _.shuffle(gatherState.currentQueue)

    const alphaPlayers = _.slice(shuffledQueue, 0, gatherState.currentSize / 2)
    const bravoPlayers = _.slice(shuffledQueue, gatherState.currentSize / 2, gatherState.currentSize)

    gatherState.alphaTeam = alphaPlayers
    gatherState.bravoTeam = bravoPlayers

    message.channel.send({
        embed: {
            title: "Gather Info",
            color: 0xff0000,
            fields: getPlayerFields()
        }
    })
}

getGatherStatus = (message) => {
    soldat.listenForServerResponse(text => {
        const parts = text.split(" ")

        if (parts[0] !== "---") {
            return false;
        }

        const alphaTickets = parseInt(parts[2])
        const bravoTickets = parseInt(parts[3])

        const alphaCaps = parseInt(parts[4])
        const bravoCaps = parseInt(parts[5])

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
                    fields: getPlayerFields()
                }
            });
        }

        return true;
    });

    soldat.soldatClient.write("=== status\n");
}

module.exports = {
    gatherState, gatherInProgress, startGame, getPlayerFields, displayQueue, getGatherStatus
}

