const gather = require("../utils/gather")
const constants = require("../constants")
const logger = require("../utils/logger")
const soldat = require("../utils/soldat")
const soldatEvents = require("../utils/soldatEvents")
const db = require("../utils/db")

module.exports = client => {
    logger.log.info(`Logged in to Discord server as ${client.user.username}!`)

    const netClient = soldat.connectToSoldatServer()
    global.soldatClient = new soldat.SoldatClient(netClient)
    global.discordChannel = client.channels.get(constants.DISCORD_CHANNEL_ID)

    db.getDbConnection().then((dbConnection) => {
        global.statsDb = new db.StatsDB(dbConnection)
        global.currentGather = new gather.Gather(soldatClient, discordChannel, statsDb)
        soldatEvents.registerSoldatEventListeners(currentGather, netClient)
    })
}
