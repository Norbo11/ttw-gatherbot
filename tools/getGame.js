const util = require("util")
const MongoClient = require('mongodb').MongoClient;
const db = require("../utils/db")
const _ = require("lodash")


const main = async () => {
    const dbConn = await db.getDbConnection()
    const statsDb = new db.StatsDB(dbConn)

    const game = await statsDb.getGameByStartTime(1590434126000)
    // const games = await statsDb.getAllGames()
    //
    // const game = _.filter(games, game => game.startTime === 1590434126000)


    console.log(game)
}

(async () => await main())()


