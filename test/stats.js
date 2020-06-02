const MongoClient = require('mongodb').MongoClient;

const chai = require('chai');
const chaiSubset = require('chai-subset');
chai.use(chaiSubset)

const expect = chai.expect

const sinon = require("sinon")
const logger = require("../utils/logger")

const stats = require("../utils/stats")
const db = require("../utils/db")
const gather = require("../utils/gather")
const soldat = require("../utils/soldat")

const TTW_CLASSES = gather.TTW_CLASSES
const TTW_EVENTS = gather.TTW_EVENTS
const SOLDAT_WEAPONS = soldat.SOLDAT_WEAPONS


describe('Stats', () => {
    let statsDb = undefined
    let conn = undefined

    beforeEach(async () => {
        const client = await MongoClient.connect("mongodb://localhost:27017")
        conn = client.db("testDb")
        statsDb = new db.StatsDB(conn)
    })

    afterEach(async () => {
        conn.dropDatabase()
    })

    it('should add a completed game', async () => {
        const game = {
            alphaPlayers: ["a", "b", "c"],
            bravoPlayers: ["d", "e", "f"],
            alphaTickets: 565,
            bravoTickets: 0,
            alphaCaps: 2,
            bravoCaps: 0,

        }

        await stats.gameFinished(statsDb, game)

        const games = await stats.getAllGames(statsDb)
        expect(games.length).equal(1)
        expect(games[0]).containSubset(game)
    });

    it('should return stats of players', async () => {
        const game = {
            alphaPlayers: ["Player1", "Player2"],
            bravoPlayers: ["Player3", "Player4"],
            alphaTickets: 565,
            bravoTickets: 0,
            startTime: 1000,
            endTime: 1000 + 20 * 60e+4, // 20 minute game
            events: [
                {
                    timestamp: 1000,
                    type: TTW_EVENTS.PLAYER_CLASS_SWITCH,
                    playerName: "Player1",
                    oldClass: TTW_CLASSES.LONG_RANGE_INFANTRY.name,
                    newClass: TTW_CLASSES.RADIOMAN.name,
                },
                {
                    timestamp: 1000,
                    type: TTW_EVENTS.PLAYER_CLASS_SWITCH,
                    playerName: "Player2",
                    oldClass: TTW_CLASSES.LONG_RANGE_INFANTRY.name,
                    newClass: TTW_CLASSES.GENERAL.name,
                },
                {
                    timestamp: 1000 + 2 * 60e+4,
                    type: TTW_EVENTS.PLAYER_KILL,
                    killerTeam: "Alpha",
                    killerName: "Player2",
                    victimTeam: "Bravo",
                    victimName: "Player3",
                    weapon: SOLDAT_WEAPONS.AK_74
                },
                {
                    timestamp: 1000 + 8 * 60e+4,
                    type: TTW_EVENTS.PLAYER_CLASS_SWITCH,
                    playerName: "Player1",
                    oldClass: TTW_CLASSES.RADIOMAN.name,
                    newClass: TTW_CLASSES.GENERAL.name,
                },
                {
                    timestamp: 1000 + 8 * 60e+4,
                    type: TTW_EVENTS.PLAYER_CLASS_SWITCH,
                    playerName: "Player2",
                    oldClass: TTW_CLASSES.GENERAL.name,
                    newClass: TTW_CLASSES.RADIOMAN.name,
                }
            ]
        }

        await stats.gameFinished(statsDb, game)

        let playerStats = await stats.getPlayerStats(statsDb, "Player1")
        expect(playerStats).containSubset({
            totalGatherTime: 20 * 60e+4,
            totalGames: 1,
            wonGames: 1,
            lostGames: 0,
       })
        expect(playerStats.classStats[TTW_CLASSES.GENERAL.name]).eql({
            playingTime: 12 * 60e+4
        })
        expect(playerStats.classStats[TTW_CLASSES.RADIOMAN.name]).eql({
            playingTime: 8 * 60e+4
        })

        playerStats = await stats.getPlayerStats(statsDb, "Player2")
        expect(playerStats).containSubset({
            totalGatherTime: 20 * 60e+4,
            totalGames: 1,
            wonGames: 1,
            lostGames: 0,
            totalKills: 1,
        })
        expect(playerStats.classStats[TTW_CLASSES.GENERAL.name]).eql({
            playingTime: 8 * 60e+4
        })
        expect(playerStats.classStats[TTW_CLASSES.RADIOMAN.name]).eql({
            playingTime: 12 * 60e+4
        })
        expect(playerStats.weaponStats[SOLDAT_WEAPONS.AK_74]).eql({
            kills: 1,
            deaths: 0,
        })

        playerStats = await stats.getPlayerStats(statsDb, "Player3")
        expect(playerStats).containSubset({
            totalGatherTime: 20 * 60e+4,
            totalGames: 1,
            wonGames: 0,
            lostGames: 1,
            totalDeaths: 1,
        })
        expect(playerStats.weaponStats[SOLDAT_WEAPONS.AK_74]).eql({
            deaths: 1,
            kills: 0,
        })

        playerStats = await stats.getPlayerStats(statsDb, "Player4")
        expect(playerStats).containSubset({
            totalGatherTime: 20 * 60e+4,
            totalGames: 1,
            wonGames: 0,
            lostGames: 1,
        })
    });
});
