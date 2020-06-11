const fs = require("fs")
const moment = require("moment")
const util = require("util")
const _ = require("lodash")
const sinon = require("sinon")
const events = require("events")
const MongoClient = require('mongodb').MongoClient;

const gather = require("../utils/gather")
const soldat = require("../utils/soldat")
const logger = require("../utils/logger")
const soldatEvents = require("../utils/soldatEvents")
const db = require("../utils/db")

const backloadGames = async () => {
    const dbConn = await db.getDbConnection()
    const statsDb = new db.StatsDB(dbConn)

    const netClient = new events.EventEmitter()
    netClient.write = (data) => {
        logger.log.info(`Wrote to server: ${data.trim()}`)
    }

    const discordChannel = sinon.stub()
    discordChannel.send = (data) => {
        logger.log.info(`Wrote to discord channel: ${data}`)
    }
    discordChannel.client = sinon.stub()
    discordChannel.client.fetchUser = async _ => {
        return {username: "TestDiscordUser"}
    }

    const hwidToPlayerName = {}
    const playerNameToHwid = {}

    let currentTimestamp = 0

    const hwidToDiscordId = {
        '3FB9882DB49': "531450590505730049", // '[WP] NamelessWolf',
        '7150942A522': "672507205295276043", // 'Janusz Korwin-Mikke',
        '7E70F684F34': "122766322739314688", // 'Norbo11',
        '1C4A7D823EF': "695187087145566238", // 'oy',
        '1412F48F843': "449626154320789524", // 'Universal Soldier',
        '382B16F8746': "449626154320789524", // 'Universal Soldier',
        '7855C05A03C': "432994416710516758", // 'pavliko',
        '4FE6652D1B2': "705422144787578980", // 'Formax',
        '19DB190DE95': "203907267924328448", // 'hs|McWise',
        '2EC8430D647': "124290386452545537", // 'Deide',
        '731C872E6BC': "449626154320789524", // 'Universal Soldier',
        '1C30F5F39F3': "71993252328247296",  // '_North',
        '68EAF77CA53': "428568369655054359", // 'Isojoenrannan hurja',
        '50EFFC48B92': "302151016600567808", // 'SethGecko',
        '451934B9692': "456828341555560458", // '[WP]-//power\\\\-',
        '2131DC7CC8C': "432994416710516758", // 'pavliko',
        '5A19489A1FD': "229683777935376384", // 'Lets_Twist',
        '7666259E411': "432994416710516758", // 'pavliko'
        '152A53F5036': "292100010882105346", // 'Mojo'
    }

    const soldatClient = new soldat.SoldatClient(netClient)
    const currentGather = new gather.Gather(soldatClient, discordChannel, statsDb, hwidToDiscordId, () => currentTimestamp)
    soldatEvents.registerSoldatEventListeners(currentGather, netClient)

    const directory = "/home/norbz/gatherserverlogs"

    const fileNames = fs.readdirSync(directory)
    const fileNamePattern = /consolelog-(?<date>\d\d-\d\d-\d\d)-(\d+)\.txt/
    const logLinePattern = /^(?<timestamp>\d\d-\d\d-\d\d \d\d:\d\d:\d\d) (?<message>.*?)$/gm
    const playerJoinPattern = /(?<playerName>.*?) has joined (?<teamName>.*?) team/
    const playerLeavePattern = /(?<playerName>.*?) has left (?<teamName>.*?) team/
    const playerJoinSpectatorsPattern = /(?<playerName>.*?) has joined spectators/
    const gatherStartPattern = /--- gatherstart (?<mapName>.*?) (?<numberOfBunkers>\d*)/
    const joiningGamePattern = /(?<playerName>.*) joining game .*? HWID:(?<hwid>.*)/
    const loadConPattern = /^\/loadcon.*$/m

    const playersPerTeam = {
        alpha: [],
        bravo: []
    }

    let sortedFileNames = []

    fileNames.forEach(fileName => {
        const fileNameMatch = fileName.match(fileNamePattern)
        if (fileNameMatch !== null) {
            const fileDate = moment(fileNameMatch.groups["date"], "YY-MM-DD", true)
            if (fileDate.isAfter(moment("2020-05-24"))) {
                sortedFileNames.push({
                    fileName,
                    fileTimestamp: fileDate.valueOf()
                })
            }

        }
    })

    sortedFileNames = _.sortBy(sortedFileNames, file => file.fileTimestamp)
    sortedFileNames = sortedFileNames.map(file => file.fileName)

    // sortedFileNames = ["consolelog-20-05-31-03.txt"]

    sortedFileNames.forEach(fileName => {
        console.log(`Reading ${fileName}`)

        const contents = fs.readFileSync(directory + "/" + fileName).toString()

        let match = logLinePattern.exec(contents)
        while (match != null) {
            const logTimestamp = moment(match.groups["timestamp"], "YY-MM-DD HH:mm:ss", true)
            currentTimestamp = logTimestamp.valueOf()

            const message = match.groups["message"]

            const playerJoinMatch = message.match(playerJoinPattern)

            if (playerJoinMatch !== null) {
                _.remove(playersPerTeam["bravo"], elem => elem === playerJoinMatch.groups["playerName"])
                _.remove(playersPerTeam["alpha"], elem => elem === playerJoinMatch.groups["playerName"])

                if (playerJoinMatch.groups["teamName"] === "alpha") {
                    playersPerTeam["alpha"].push(playerJoinMatch.groups["playerName"])
                }

                if (playerJoinMatch.groups["teamName"] === "bravo") {
                    playersPerTeam["bravo"].push(playerJoinMatch.groups["playerName"])
                }
            }

            const playerLeaveMatch = message.match(playerLeavePattern)
            if (playerLeaveMatch !== null) {
                _.remove(playersPerTeam["bravo"], elem => elem === playerLeaveMatch.groups["playerName"])
                _.remove(playersPerTeam["alpha"], elem => elem === playerLeaveMatch.groups["playerName"])
            }

            const playerJoinedSpectatorsMatch = message.match(playerJoinSpectatorsPattern)
            if (playerJoinedSpectatorsMatch !== null) {
                _.remove(playersPerTeam["bravo"], elem => elem === playerJoinedSpectatorsMatch.groups["playerName"])
                _.remove(playersPerTeam["alpha"], elem => elem === playerJoinedSpectatorsMatch.groups["playerName"])
            }

            const gatherStartMatch = message.match(gatherStartPattern)
            if (gatherStartMatch !== null) {
                currentGather.currentSize = playersPerTeam["alpha"].length * 2
                currentGather.currentQueue = [...playersPerTeam["alpha"], ...playersPerTeam["bravo"]].map(name => {
                    return {id: hwidToDiscordId[playerNameToHwid[name]]}
                })

                currentGather.inGameState = gather.IN_GAME_STATES["GATHER_PRE_RESET"]

                currentGather.alphaTeam = [...playersPerTeam["alpha"]].map(name => {
                    return {id: hwidToDiscordId[playerNameToHwid[name]]}
                })
                currentGather.bravoTeam = [...playersPerTeam["bravo"]].map(name => {
                    return {id: hwidToDiscordId[playerNameToHwid[name]]}
                })
                currentGather.playerNameToHwid = playerNameToHwid
            }

            const joiningGameMatch = message.match(joiningGamePattern)

            if (joiningGameMatch !== null) {
                hwidToPlayerName[joiningGameMatch.groups["hwid"]] = joiningGameMatch.groups["playerName"]
                playerNameToHwid[joiningGameMatch.groups["playerName"]] = joiningGameMatch.groups["hwid"]
            }

            const loadConMatch = message.match(loadConPattern)
            if (loadConMatch !== null) {
                playersPerTeam.alpha = []
                playersPerTeam.bravo = []
            }

            netClient.emit("data", message)

            match = logLinePattern.exec(contents)
        }

        console.log(`Finished reading ${fileName}`)
    })

    console.log(util.inspect(hwidToPlayerName))
}

(async () => await backloadGames())()