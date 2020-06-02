const logger = require("../utils/logger")

module.exports = {
    aliases: ["server"],
    description: "Get the IP address of the server.",
    execute(client, message, args) {
        message.channel.send({
            embed: {
                title: "Server Info",
                color: 0xff0000,
                fields: [currentGather.getServerLinkField()]
            },
        }).catch((e) => console.error(e.response.body))
    },
};
