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
                    timestamp: 1000 + 60e+3,
                    type: TTW_EVENTS.BUNKER_CONQUER,
                    discordId: "Player2",
                    conqueringTeam: "Alpha",
                    alphaTickets: "1000",
                    bravoTickets: "900",
                    currentAlphaBunker: 1,
                    currentBravoBunker: 4,
                    sabotaging: false
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
            totalConquers: 0,
            totalTicketsLeftInWonGames: 565
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
            totalConquers: 1,
            totalTicketsLeftInWonGames: 565
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
            totalTicketsLeftInWonGames: 0
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
            totalTicketsLeftInWonGames: 0
        })
    });

    it('should return stats of gathers', async () => {
        const games = [
            {
                alphaPlayers: ["Player1", "Player2"],
                bravoPlayers: ["Player3", "Player4"],
                alphaTickets: 565,
                bravoTickets: 0,
                startTime: 1000,
                endTime: 1000 + 20 * 60e+3, // 20 minute game
                events: [],
                mapName: "ttw_one",
            },
            {
                alphaPlayers: ["Player1", "Player2"],
                bravoPlayers: ["Player3", "Player4"],
                alphaTickets: 201,
                bravoTickets: 0,
                startTime: 1000 + 30 * 60e+3,
                endTime: 1000 + 40 * 60e+3, // 10 minute game
                events: [],
                mapName: "ttw_two",
            },
            {
                alphaPlayers: ["Player1", "Player2", "Player3"],
                bravoPlayers: ["Player4", "Player5", "Player6"],
                alphaTickets: 0,
                bravoTickets: 1004,
                startTime: 1000 + 60 * 60e+3,
                endTime: 1000 + 75 * 60e+3, // 15 minute game
                events: [],
                mapName: "ttw_two",
            },
        ]

        await Promise.all(games.map(async game => statsDb.insertGame(game)))

        const gatherStats = await stats.getGatherStats(statsDb)
        expect(gatherStats).containSubset({
            totalGames: 3,
            totalGatherTime: 45 * 60e+3,
            totalTicketsLeft: 1770,
            mapStats: {
                ttw_one: {
                    totalGames: 1
                },
                ttw_two: {
                    totalGames: 2
                }
            }
        })
    });

    it('should return stats of top players', async () => {
        const games = [
            {
                alphaPlayers: ["Player1", "Player2"],
                bravoPlayers: ["Player3", "Player4"],
                alphaTickets: 565,
                bravoTickets: 0,
                startTime: 1000,
                endTime: 1000 + 20 * 60e+3, // 20 minute game
                events: [],
                mapName: "ttw_one",
            },
            {
                alphaPlayers: ["Player1", "Player2"],
                bravoPlayers: ["Player3", "Player4"],
                alphaTickets: 201,
                bravoTickets: 0,
                startTime: 1000 + 30 * 60e+3,
                endTime: 1000 + 40 * 60e+3, // 10 minute game
                events: [],
                mapName: "ttw_two",
            },
            {
                alphaPlayers: ["Player1", "Player2", "Player3"],
                bravoPlayers: ["Player4", "Player5", "Player6"],
                alphaTickets: 0,
                bravoTickets: 1004,
                startTime: 1000 + 60 * 60e+3,
                endTime: 1000 + 75 * 60e+3, // 15 minute game
                events: [],
                mapName: "ttw_two",
            },
        ]

        await Promise.all(games.map(async game => statsDb.insertGame(game)))

        const topPlayers = await stats.getTopPlayers(statsDb, 0)
        expect(topPlayers.topPlayersByWinRate.map(player => player.discordId)).eql(["Player5", "Player6", "Player1", "Player2", "Player4"])
        expect(topPlayers.topPlayersByTotalGames.map(player => player.discordId)).eql(["Player1", "Player2", "Player3", "Player4", "Player5"])
    })
});

describe('Stats Formatter', () => {
    it('should format player stats', async () => {
        const playerStats = {
            totalGatherTime: 45 * 60e+3,
            totalGames: 3,
            wonGames: 2,
            lostGames: 1,
            totalKills: 12,
            totalDeaths: 7,
            totalCaps: 2,
            totalConquers: 10,
            totalTicketsLeftInWonGames: 2541,
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

        const formatted = stats.formatGeneralStatsForPlayer("Player", playerStats)

        expect(formatted).eql({
            embed: {
                fields: [
                    {
                        name: "**Overall Stats for Player**",
                        value:
                            "**Gathers Played**: 3\n" +
                            "**Total Gather Time**: 00:45:00\n" +
                            "**Won/Lost**: 2/1 (67%)\n" +
                            "**Kills/Deaths**: 12/7 (1.71)\n" +
                            "**Caps**: 2 (0.67 per game)\n" +
                            "**Bunker Conquers**: 10\n" +
                            "**Avg Tickets Left in Won Games**: 1271 tickets",
                    },
                    {
                        name: "**Favourite Weapons**",
                        value:
                            "**Ak-74**: 12 kills\n" +
                            "**HK MP5**: 5 kills\n" +
                            "**FN Minimi**: 3 kills",
                        inline: true,
                    },
                    {
                        name: "**Favourite Classes**",
                        value:
                            "**Radioman**: 00:25:00\n" +
                            "**General**: 00:20:00\n" +
                            "**Artillery**: 00:00:00",
                        inline: true,
                    },
                ]
            }
        })
    })

    it('should format gather stats', async () => {
        const gatherStats = {
            totalGames: 3,
            totalGatherTime: 45 * 60e+3,
            totalTicketsLeft: 1770,
            mapStats: {
                ttw_one: {
                    totalGames: 1
                },
                ttw_two: {
                    totalGames: 2
                }
            }
        }

        const formatted = stats.formatGatherStats(gatherStats)

        expect(formatted).eql({
            embed: {
                fields: [
                    {
                        name: "**Overall Stats**",
                        value:
                            "**Gathers Played**: 3\n" +
                            "**Total Gather Time**: 00:45:00\n" +
                            "**Average Gather Time**: 00:15:00\n" +
                            "**Average Tickets Left**: 590"
                    },
                    {
                        name: "**Favourite Maps**",
                        value:
                            "**ttw_two**: 2 games\n" +
                            "**ttw_one**: 1 games",
                    },
                ]
            }
        })
    })
})
