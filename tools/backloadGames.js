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

    const mongoClient = await MongoClient.connect("mongodb://localhost:27017")
    const mongoConn = mongoClient.db("BackloadDB")
    const statsDb = new db.StatsDB(mongoConn)

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

    let currentTimestamp = 0
        // [
        //     '[WP] NamelessWolf',   'oy',
        //     'Norbo11',             'Janusz Korwin-Mikke',
        //     'Universal Soldier',   'pavliko',
        //     'Formax',              'hs|McWise',
        //     'Deide',               '_North',
        //     'Isojoenrannan hurja', '@vanatox is gay',
        //     'SethGecko',           '[WP]-//power\\\\-',
        //     'ORANG',               'Lets_Twist'
        // ]

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
        '68EAF77CA53': 'Isojoenrannan hurja',
        '50EFFC48B92': "302151016600567808", // 'SethGecko',
        '451934B9692': "456828341555560458", // '[WP]-//power\\\\-',
        '2131DC7CC8C': "432994416710516758", // 'pavliko',
        '32F2C7271C4': 'ORANG',
        '5A19489A1FD': "229683777935376384", // 'Lets_Twist',
        '7666259E411': "432994416710516758", // 'pavliko'
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
    const gatherStartPattern = /--- gatherstart (?<mapName>.*?) (?<numberOfBunkers>\d*)/
    const joiningGamePattern = /(?<playerName>.*) joining game .*? HWID:(?<hwid>.*)/

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
                if (playerJoinMatch.groups["teamName"] === "alpha" && !playersPerTeam["alpha"].includes(playerJoinMatch.groups["playerName"])) {
                    _.remove(playersPerTeam["bravo"], elem => elem === playerJoinMatch.groups["playerName"])
                    playersPerTeam["alpha"].push(playerJoinMatch.groups["playerName"])
                }
                if (playerJoinMatch.groups["teamName"] === "bravo" && !playersPerTeam["bravo"].includes(playerJoinMatch.groups["playerName"])) {
                    _.remove(playersPerTeam["alpha"], elem => elem === playerJoinMatch.groups["playerName"])
                    playersPerTeam["bravo"].push(playerJoinMatch.groups["playerName"])
                }
            }
            const playerLeaveMatch = message.match(playerLeavePattern)

            if (playerLeaveMatch !== null) {
                if (playerLeaveMatch.groups["teamName"] === "alpha") {
                    _.remove(playersPerTeam["alpha"], elem => elem === playerLeaveMatch.groups["playerName"])
                }
                if (playerLeaveMatch.groups["teamName"] === "bravo") {
                    _.remove(playersPerTeam["bravo"], elem => elem === playerLeaveMatch.groups["playerName"])
                }
            }
            const gatherStartMatch = message.match(gatherStartPattern)

            if (gatherStartMatch !== null) {
                currentGather.currentSize = playersPerTeam["alpha"].length
                currentGather.currentQueue = [...playersPerTeam["alpha"], ...playersPerTeam["bravo"]].map(name => {
                    return {id: name}
                })

                currentGather.inGameState = gather.IN_GAME_STATES["GATHER_PRE_RESET"]

                currentGather.alphaTeam = [...playersPerTeam["alpha"]].map(name => {
                    return {id: name}
                })
                currentGather.bravoTeam = [...playersPerTeam["bravo"]].map(name => {
                    return {id: name}
                })
            }

            const joiningGameMatch = message.match(joiningGamePattern)

            if (joiningGameMatch !== null) {
                hwidToPlayerName[joiningGameMatch.groups["hwid"]] = joiningGameMatch.groups["playerName"]
            }

            netClient.emit("data", message)

            match = logLinePattern.exec(contents)
        }

        console.log(`Finished reading ${fileName}`)
    })

    console.log(util.inspect(hwidToPlayerName))
}

(async () => await backloadGames())()