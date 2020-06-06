const util = require("util")
const MongoClient = require('mongodb').MongoClient;
const db = require("../utils/db")


const main = async () => {
    const mongoClient = await MongoClient.connect("mongodb://localhost:27017")
    const mongoConn = mongoClient.db("BackloadDB")
    const statsDb = new db.StatsDB(mongoConn)

    const discordIds = await statsDb.getAllDiscordIds()
    console.log(util.inspect(discordIds))
}

(async () => await main())()


