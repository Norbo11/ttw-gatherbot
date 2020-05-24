const net = require("net");
const soldat = require("../utils/soldat")

module.exports = {
    aliases: ["gatherstatus"],
    description: "Check the current status of the gather.",
    execute(client, message, args) {
        soldat.soldatClient.write("=== status\n");

        soldat.listenForServerResponse(text => {
            const ticks = text.split("---").slice(1).join("---");
            const ticksa = ticks.split(" ")[2];
            const ticksb = ticks.split(" ")[3];
            const capsa = ticks.split(" ")[4];
            const capsb = ticks.split(" ")[5];

            if (text.match(/501 500/)) {
                message.channel.send({
                    embed: {
                        color: 3447003,
                        description: "No gather in progress!",
                    }
                });
            } else {
                message.channel.send({
                    embed: {
                        color: 3447003,
                        description: `**Gather progress**\n :a: **Alpha** tickets: ${ticksa} caps: ${capsa}\n :regional_indicator_b: **Bravo** tickets: ${ticksb} caps: ${capsb}`,
                    }
                });
            }
        });
    },
};
