const util = require("util")
const MongoClient = require('mongodb').MongoClient;
const db = require("../utils/db")
const _ = require("lodash")


const main = async () => {
    const mongoClient = await MongoClient.connect("mongodb://localhost:27017")
    const mongoConn = mongoClient.db("BackloadDB")
    const statsDb = new db.StatsDB(mongoConn)

    const discordIds = await statsDb.getAllDiscordIds()
    console.log(util.inspect(discordIds))

    const games = await statsDb.getAllGames()

    games.forEach(game => {
        if (game.alphaPlayers.length !== game.bravoPlayers.length) {
            throw new Error()
        }

        if (game.size !== game.alphaPlayers.length){
            throw new Error()
        }

        if (game.events.length < 0) {
            throw new Error()
        }

        game.events.forEach(event => {
            if (event.timestamp < game.startTime) {
                throw new Error()
            }
            if (event.timestamp > game.endTime) {
                throw new Error()
            }
        })
    })
}

(async () => await main())()


