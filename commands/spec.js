const gather = require("../utils/gather")

module.exports = {
    aliases: ["spec"],
    description: "Spectate the current gather.",
    execute(client, message, args) {
        if (!gather.gatherInProgress()) {
            message.reply("a gather is not currently in progress.")
            return
        }

        if (gather.gatherState.currentQueue.includes(message.author)) {
            message.reply("you are in the current gather - go play.")
            return
        }

        message.reply({
            embed: {
                title: "Join as Spectator",
                color: 0xff0000,
                fields: [gather.getServerLinkField(gather.gatherState.password)]
            }
        })
    },
}
