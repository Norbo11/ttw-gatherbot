const _ = require("lodash")
const moment = require("moment")

const logger = require("./logger")
const gather = require("./gather")
const soldat = require("./soldat")

const TTW_CLASSES = gather.TTW_CLASSES
const TTW_EVENTS = gather.TTW_EVENTS
const SOLDAT_WEAPONS = soldat.SOLDAT_WEAPONS

getCaps = (discordId, events) => {
    events = _.filter(events, event =>
        event.type === TTW_EVENTS.FLAG_CAP
        && event.discordId === discordId
    )

    return events.length
}


getTimePlayedPerClass = (startTime, endTime, discordId, events) => {
    const classTime = {}

    Object.keys(TTW_CLASSES).forEach(classKey => {
        classTime[TTW_CLASSES[classKey].id] = 0
    })

    events = _.filter(events, event =>
        event.type === TTW_EVENTS.PLAYER_CLASS_SWITCH
        && event.discordId === discordId
    )

    if (events.length === 0) {
        logger.log.warn(`Got no class switch events for player ${discordId}! Gather start time: ${startTime}`)
        return classTime
    }

    let lastEventTimestamp = events[0].timestamp
    let lastClassId = events[0].newClassId

    events = _.takeRight(events, events.length - 1)

    events.forEach(event => {
        classTime[lastClassId] += event.timestamp - lastEventTimestamp
        lastEventTimestamp = event.timestamp
        lastClassId = event.newClassId
    })

    classTime[lastClassId] += endTime - lastEventTimestamp

    return classTime
}

getKillsAndDeathsPerWeapon = (discordId, events) => {
    const weaponStats = {}

    Object.keys(SOLDAT_WEAPONS).forEach(weaponKey => {
        weaponStats[SOLDAT_WEAPONS[weaponKey].id] = {
            kills: 0,
            deaths: 0
        }
    })

    const killEvents = _.filter(events, event =>
        event.type === TTW_EVENTS.PLAYER_KILL
        && event.killerDiscordId === discordId
        && event.killerDiscordId !== event.victimDiscordId // Do not count selfkills
        && event.killerTeam !== event.victimTeam // Do not count friendly kills
    )
    const deathEvents = _.filter(events, event =>
        event.type === TTW_EVENTS.PLAYER_KILL
        && event.victimDiscordId === discordId
        && event.killerDiscordId !== event.victimDiscordId // Do not count selfkills
        && event.killerTeam !== event.victimTeam // Do not count friendly kills
    )

    killEvents.forEach(event => {
        weaponStats[event.weaponId].kills += 1
    })

    deathEvents.forEach(event => {
        weaponStats[event.weaponId].deaths += 1
    })

    return weaponStats
}

getPlayerStats = async (statsDb, discordId) => {
    const games = await statsDb.getGamesWithPlayer(discordId)

    let totalGames = 0
    let wonGames = 0
    let lostGames = 0
    let totalKills = 0
    let totalDeaths = 0
    let totalGatherTime = 0
    let totalCaps = 0
    const classStats = {}
    const weaponStats = {}

    Object.keys(TTW_CLASSES).forEach(classKey => {
        classStats[TTW_CLASSES[classKey].id] = {
            playingTime: 0
        }
    })

    Object.keys(SOLDAT_WEAPONS).forEach(weaponKey => {
        weaponStats[SOLDAT_WEAPONS[weaponKey].id] = {
            kills: 0,
            deaths: 0
        }
    })

    games.forEach(game => {
        totalGames += 1

        const winningTeam = game.alphaTickets > game.bravoTickets ? "Alpha" : "Bravo"
        const playerTeam = game.alphaPlayers.includes(discordId) ? "Alpha" : "Bravo"

        if (winningTeam === playerTeam) {
            wonGames += 1
        } else {
            lostGames += 1
        }

        totalCaps += getCaps(discordId, game.events)

        const timePlayedPerClass = getTimePlayedPerClass(game.startTime, game.endTime, discordId, game.events)
        const killsAndDeathsPerWeapon = getKillsAndDeathsPerWeapon(discordId, game.events)
        const gameTime = game.endTime - game.startTime

        Object.keys(timePlayedPerClass).forEach(classId => {
            classStats[classId].playingTime += timePlayedPerClass[classId]
        })

        Object.keys(killsAndDeathsPerWeapon).forEach(weaponId => {
            weaponStats[weaponId].kills += killsAndDeathsPerWeapon[weaponId].kills
            weaponStats[weaponId].deaths += killsAndDeathsPerWeapon[weaponId].deaths
            totalKills += killsAndDeathsPerWeapon[weaponId].kills
            totalDeaths += killsAndDeathsPerWeapon[weaponId].deaths
        })

        totalGatherTime += gameTime
    })

    return {
        totalGames, wonGames, lostGames, classStats, weaponStats, totalKills, totalDeaths, totalGatherTime, totalCaps
    }
}

const formatMilliseconds = (millis) => {
    const momentDuration = moment.duration(millis)
    return `${momentDuration.hours().toString().padStart(2, "0")}:${momentDuration.minutes().toString().padStart(2, "0")}:${momentDuration.seconds().toString().padStart(2, "0")}`
}

const formatGeneralStatsForPlayer = (playerStats) => {
    const overallStats = [
        `**Gathers Played**: ${playerStats.totalGames}`,
        `**Total Gather Time**: ${formatMilliseconds(playerStats.totalGatherTime)}`,
        `**Won/Lost**: ${playerStats.wonGames}/${playerStats.lostGames} (${Math.round(playerStats.wonGames / playerStats.totalGames * 100)}%)`,
        `**Kills/Deaths**: ${playerStats.totalKills}/${playerStats.totalDeaths} (${(playerStats.totalKills / playerStats.totalDeaths).toFixed(2)})`,
        `**Caps**: ${playerStats.totalCaps} (${(playerStats.totalCaps / playerStats.totalGames).toFixed(2)} per game)`,
    ]

    let favouriteWeapons = Object.keys(playerStats.weaponStats).map(weaponId => {
        return {weaponName: soldat.getWeaponById(weaponId).formattedName, ...playerStats.weaponStats[weaponId]}
    })

    favouriteWeapons = _.sortBy(favouriteWeapons, weaponStat => -weaponStat.kills)
    favouriteWeapons = _.take(favouriteWeapons, 3)
    favouriteWeapons = favouriteWeapons.map(weaponStat => `**${weaponStat.weaponName}**: ${weaponStat.kills} kills`)

    let favouriteClasses = Object.keys(playerStats.classStats).map(classId => {
        return {className: gather.getClassById(classId).formattedName, ...playerStats.classStats[classId]}
    })

    favouriteClasses = _.sortBy(favouriteClasses, classStat => -classStat.playingTime)
    favouriteClasses = _.take(favouriteClasses, 3)
    favouriteClasses = favouriteClasses.map(classStat => `**${classStat.className}**: ${formatMilliseconds(classStat.playingTime)}`)

    return {
        embed: {
            fields: [
                {
                    name: "**Overall Stats**",
                    value: overallStats.join("\n")
                },
                {
                    name: "**Favourite Weapons**",
                    value: favouriteWeapons.join("\n"),
                    inline: true
                },
                {
                    name: "**Favourite Classes**",
                    value: favouriteClasses.join("\n"),
                    inline: true
                },
            ]
        }
    }
}

module.exports = {
    getPlayerStats, formatGeneralStatsForPlayer
}