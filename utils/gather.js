_ = require("lodash")

gatherState = {
    currentSize: 6,
    currentQueue: [],
    currentMap: "ttw_test"
}

displayQueue = (message) => {
    const queueMembers = gatherState.currentQueue.map(user => `<@${user.id}>`)
    for (let i = 0; i < gatherState.currentSize - gatherState.currentQueue.length; i++) {
        queueMembers.push(":bust_in_silhouette:")
    }
    message.channel.send(`[${queueMembers.join(" - ")}] [${gatherState.currentMap}]`)
}

startGame = (message) => {
    const shuffledQueue = _.shuffle(gatherState.currentQueue)

    const alphaPlayers = _.slice(shuffledQueue, 0, gatherState.currentSize / 2)
    const bravoPlayers = _.slice(shuffledQueue, gatherState.currentSize / 2, gatherState.currentSize)

    const alphaPlayersString = alphaPlayers.map(user => `<@${user.id}>`).join(" - ")
    const bravoPlayersString = bravoPlayers.map(user => `<@${user.id}>`).join(" - ")

    message.channel.send({
        embed: {
            title: "Server Info",
            color: 0xff0000,
            fields: [
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
    })
}

module.exports = {
    displayQueue, startGame, gatherState
}

