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

    // Take this from hwidToDiscordId.json which shouldn't be committed
    const hwidToDiscordId = {}

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