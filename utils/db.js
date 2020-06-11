const MongoClient = require('mongodb').MongoClient;
const _ = require("lodash")
const logger = require("./logger")
const constants = require("../constants")

getUrl = () => {
    return constants.MONGO_URL
}

getDbName = () => {
    return "TTWStats"
}

getDbConnection = async () => {
    const url = getUrl()
    const dbName = getDbName()

    logger.log.info(`Attempting connection to DB at ${url}/${dbName}`)
    const client = await MongoClient.connect(url)
    logger.log.info(`Successfully connected to DB at ${url}/${dbName}`)
    return client.db(dbName)
}

class StatsDB {
    constructor(db) {
        this.db = db;
    }

    async getAllGames() {
        const result = await this.db.collection("Game").find({})
        return result.toArray()
    }

    async getGameByStartTime(startTime) {
        const result = await this.db.collection("Game").find({startTime})
        return result.toArray()
    }

    async getAllDiscordIds() {
        const games = await this.getAllGames()
        const discordIds = new Set()
        games.forEach(game => {
            game.alphaPlayers.forEach(player => discordIds.add(player))
            game.bravoPlayers.forEach(player => discordIds.add(player))
        })

        return [...discordIds] // Convert back to an array so that we can use things like .map
    }

    async insertGame(game) {
        logger.log.info("Saving game...")
        const result = await this.db.collection("Game").insertOne(game)
        logger.log.info("Game saved!")
        return result.insertedId
    }

    async getGamesWithPlayer(discordId) {
        const result = await this.db.collection("Game").find({
            $or: [
                {alphaPlayers: discordId},
                {bravoPlayers: discordId}
            ]
        })
        return result.toArray()
    }

    async getHwidToDiscordIdMap() {
        const result = await this.db.collection("HWID").find({});
        const map = await result.next()

        if (map === null) {
            return {}
        } else {
            return map
        }
    }

    async mapHwidToDiscordId(hwid, discordId) {
        const hwidMap = await this.getHwidToDiscordIdMap()
        hwidMap[hwid] = discordId

        await this.db.collection("HWID").deleteOne({})
        await this.db.collection("HWID").insertOne(hwidMap)
    }
}

module.exports = {
    StatsDB, getDbConnection
}