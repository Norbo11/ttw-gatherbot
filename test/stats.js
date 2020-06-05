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

    it('should return stats of players', async () => {
        const game = {
            alphaPlayers: ["Player1", "Player2"],
            bravoPlayers: ["Player3", "Player4"],
            alphaTickets: 565,
            bravoTickets: 0,
            startTime: 1000,
            endTime: 1000 + 20 * 60e+3, // 20 minute game
            events: [
                {
                    timestamp: 1000,
                    type: TTW_EVENTS.PLAYER_CLASS_SWITCH,
                    discordId: "Player1",
                    newClassId: TTW_CLASSES.RADIOMAN.id,
                },
                {
                    timestamp: 1000,
                    type: TTW_EVENTS.PLAYER_CLASS_SWITCH,
                    discordId: "Player2",
                    newClassId: TTW_CLASSES.GENERAL.id,
                },
                {
                    timestamp: 1000 + 2 * 60e+3,
                    type: TTW_EVENTS.PLAYER_KILL,
                    killerTeam: "Alpha",
                    killerDiscordId: "Player2",
                    victimTeam: "Bravo",
                    victimDiscordId: "Player3",
                    weaponId: SOLDAT_WEAPONS.AK_74.id,
                },
                {
                    timestamp: 1000 + 8 * 60e+3,
                    type: TTW_EVENTS.PLAYER_CLASS_SWITCH,
                    discordId: "Player1",
                    newClassId: TTW_CLASSES.GENERAL.id,
                },
                {
                    timestamp: 1000 + 8 * 60e+3,
                    type: TTW_EVENTS.PLAYER_CLASS_SWITCH,
                    discordId: "Player2",
                    newClassId: TTW_CLASSES.RADIOMAN.id,
                },
                {
                    timestamp: 1000 + 9 * 60e+3,
                    type: TTW_EVENTS.FLAG_CAP,
                    discordId: "Player2",
                    teamName: "Alpha"
                }
            ]
        }

        await statsDb.insertGame(game)

        let playerStats = await stats.getPlayerStats(statsDb, "Player1")
        expect(playerStats).containSubset({
            totalGatherTime: 20 * 60e+3,
            totalGames: 1,
            wonGames: 1,
            lostGames: 0,
            totalCaps: 0,
        })
        expect(playerStats.classStats[TTW_CLASSES.GENERAL.id]).eql({
            playingTime: 12 * 60e+3
        })
        expect(playerStats.classStats[TTW_CLASSES.RADIOMAN.id]).eql({
            playingTime: 8 * 60e+3
        })

        playerStats = await stats.getPlayerStats(statsDb, "Player2")
        expect(playerStats).containSubset({
            totalGatherTime: 20 * 60e+3,
            totalGames: 1,
            wonGames: 1,
            lostGames: 0,
            totalKills: 1,
            totalCaps: 1,
        })
        expect(playerStats.classStats[TTW_CLASSES.GENERAL.id]).eql({
            playingTime: 8 * 60e+3
        })
        expect(playerStats.classStats[TTW_CLASSES.RADIOMAN.id]).eql({
            playingTime: 12 * 60e+3
        })
        expect(playerStats.weaponStats[SOLDAT_WEAPONS.AK_74.id]).eql({
            kills: 1,
            deaths: 0,
        })

        playerStats = await stats.getPlayerStats(statsDb, "Player3")
        expect(playerStats).containSubset({
            totalGatherTime: 20 * 60e+3,
            totalGames: 1,
            wonGames: 0,
            lostGames: 1,
            totalDeaths: 1,
        })
        expect(playerStats.weaponStats[SOLDAT_WEAPONS.AK_74.id]).eql({
            deaths: 1,
            kills: 0,
        })

        playerStats = await stats.getPlayerStats(statsDb, "Player4")
        expect(playerStats).containSubset({
            totalGatherTime: 20 * 60e+3,
            totalGames: 1,
            wonGames: 0,
            lostGames: 1,
        })
    });
});

describe('Stats Formatter', () => {
    it('should format player stats', async () => {
        const playerStats = {
            totalGatherTime: 45 * 60e+3,
            totalGames: 2,
            wonGames: 1,
            lostGames: 1,
            totalKills: 12,
            totalDeaths: 7,
            totalCaps: 2,
            classStats: {
                [TTW_CLASSES.GENERAL.id]: {
                    playingTime: 20 * 60e+3
                },
                [TTW_CLASSES.RADIOMAN.id]: {
                    playingTime: 25 * 60e+3
                },
                [TTW_CLASSES.ARTILLERY.id]: {
                    playingTime: 0
                },
            },
            weaponStats: {
                [SOLDAT_WEAPONS.AK_74.id]: {
                    kills: 12,
                    deaths: 7
                },
                [SOLDAT_WEAPONS.FN_MINIMI.id]: {
                    kills: 3,
                    deaths: 2
                },
                [SOLDAT_WEAPONS.HK_MP5.id]: {
                    kills: 5,
                    deaths: 7
                }
            }
        }

        const formatted = stats.formatGeneralStatsForPlayer(playerStats)

        expect(formatted).eql({
            embed: {
                fields: [
                    {
                        name: "**Overall Stats**",
                        value: "**Gathers Played**: 2\n**Total Gather Time**: 00:45:00\n**Won/Lost**: 1/1 (50%)\n**Kills/Deaths**: 12/7 (1.71)\n**Caps**: 2 (1.00 per game)",
                    },
                    {
                        name: "**Favourite Weapons**",
                        value: "**Ak-74**: 12 kills\n**HK MP5**: 5 kills\n**FN Minimi**: 3 kills",
                        inline: true,
                    },
                    {
                        name: "**Favourite Classes**",
                        value: "**Radioman**: 00:25:00\n**General**: 00:20:00\n**Artillery**: 00:00:00",
                        inline: true,
                    },
                ]
            }
        })
    })

    // TODO: Add a !mapstats command
})
