const MongoClient = require('mongodb').MongoClient;
const logger = require("./logger")

const URL = 'mongodb://localhost:27017';

getUrl = () => {
    return URL
}

getDbName = () => {
    return "TTWStats"
}

getDbConnection = async () => {
    const url = getUrl()
    const dbName = getDbName()
    logger.log.info(`Connecting to DB at ${url}/${dbName}`)

    const client = await MongoClient.connect(url)
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

    async insertGame(game) {
        const result = await this.db.collection("Game").insertOne(game)
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
}

module.exports = {
    StatsDB, getDbConnection
}