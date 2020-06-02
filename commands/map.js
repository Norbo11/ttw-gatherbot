const logger = require("../utils/logger")


module.exports = {
    aliases: ["map"],
    description: "View or change the current map.",
    execute(client, message, args) {
        if (args.length !== 1) {
            message.channel.send("Please provide a single map name.")
            return;
        }

        message.channel.send("Changing map, hang on...")

        soldatClient.changeMap(args[0], (mapChangeResult) => {
            if (mapChangeResult === "found") {
                message.channel.send({
                    embed: {
                        color: 0xff0000,
                        description: `Map changed to: **${args}**`,
                    }
                });
            } else {
                message.channel.send({
                    embed: {
                        color: 0xff0000,
                        description: "Map not found!",
                    }
                });
            }
        })
    },
};
