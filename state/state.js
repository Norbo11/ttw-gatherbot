currentSize = 6
maxQueueSize = 6
currentQueue = []
currentMap = "ttw_test"

displayQueue = (message) => {
    const queueMembers = currentQueue.map(user => `<@${user.id}>`)
    for (let i = 0; i < maxQueueSize - currentQueue.length; i++) {
        queueMembers.push(':bust_in_silhouette:')
    }
    message.channel.send(`[${queueMembers.join(" - ")}] [${currentMap}]`)
}

module.exports = {
    currentQueue, displayQueue, currentSize
}

