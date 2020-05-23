const state = require("../state/state.js")
const soldat = require("../state/soldat")

module.exports = {
    aliases: ['size'],
    description: 'Get or set the gather size.',
    execute(client, message, args) {
        if (args.length === 0) {
            message.channel.send(`The current gather size is ${state.currentSize}`)
            return
        }

        const newSize = args[0]

        message.channel.send({
            embed: {
                color: 3447003,
                description: "[soldat://51.68.137.225:23075/goaway/](soldat://51.68.137.225:23075/goaway/)",
            }
        });

        soldat.soldatClient.write(`/gathersize ${newSize}\n`);
        soldat.soldatClient.write('/restart\n');
        soldat.soldatClient.write(`/say Gather size set to ${newSize}\m`);

        state.currentSize = newSize

        message.channel.send({
            embed: {
                color: 3447003,
                description: `Server size set to ${newSize}`,
            }
        });
    },
};
