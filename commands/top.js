const logger = require("../utils/logger")
const utils = require("../utils/commandUtils")
const stats = require("../utils/stats")


module.exports = {
    aliases: ["top"],
    description: "Show the top players.",
    execute(client, message, args) {
        stats.getTopPlayers(currentStatsDb, 5).then(topPlayers => {

            const discordIdToUsername = {}
            Promise.all(topPlayers.allDiscordIds.map(async (discordId) => {
                const user = await client.fetchUser(discordId)
                discordIdToUsername[discordId] = user.username
            })).then(() => {
                message.channel.send(stats.formatTopPlayers(topPlayers, discordIdToUsername))
            })
        })
    },
};
