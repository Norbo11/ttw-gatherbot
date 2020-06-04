const gather = require("../utils/gather")
const constants = require("../constants")
const logger = require("../utils/logger")
const soldat = require("../utils/soldat")
const soldatEvents = require("../utils/soldatEvents")
const db = require("../utils/db")

module.exports = client => {
    logger.log.info(`Logged in to Discord server as ${client.user.username}!`)

    const netClient = soldat.connectToSoldatServer()
    global.currentSoldatClient = new soldat.SoldatClient(netClient)
    global.currentDiscordChannel = client.channels.get(constants.DISCORD_CHANNEL_ID)

    db.getDbConnection().then(async (dbConnection) => {
        global.currentStatsDb = new db.StatsDB(dbConnection)

        const hwidToDiscordId = await currentStatsDb.getHwidToDiscordIdMap()

        global.currentGather = new gather.Gather(currentSoldatClient, currentDiscordChannel, currentStatsDb, hwidToDiscordId)
        soldatEvents.registerSoldatEventListeners(currentGather, netClient)
    })
}
