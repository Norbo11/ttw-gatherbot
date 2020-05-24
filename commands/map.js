const soldat = require("../utils/soldat")
const logger = require("../utils/logger")


module.exports = {
    aliases: ["map"],
    description: "View or change the current map.",
    execute(client, message, args) {
        message.channel.send("Changing map, hang on...")

        soldat.listenForServerResponse(text => {
            if (text.match(/Map not found/)) {
                message.channel.send({
                    embed: {
                        color: 3447003,
                        description: "Map not found!",
                    }
                });
                return true;
            }

            if (text.match(/Initializing bunkers/)) {
                const args = message.content.slice(5,).split(" ");
                message.channel.send({
                    embed: {
                        color: 3447003,
                        description: `Map changed to: **${args}**`,
                    }
                });
                return true;
            }

            return false;
        })

        soldat.soldatClient.write(`/map ${args[0]}\n`);
    },
};
