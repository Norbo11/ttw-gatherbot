const state = require("../state/state.js")
const net = require('net');

module.exports = {
    name: 'size',
    description: 'Get or set the gather size.',
    execute(message, args) {
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

        const client = net.connect(23075, '51.68.137.225', function () {
            client.write('ttwadmin\n');
            client.write(`/gathersize ${newSize}\n`);
            client.write('/restart\n');
            client.end(`/say Gather size set to ${newSize}\m`);

            state.currentSize = newSize

            message.channel.send({
                embed: {
                    color: 3447003,
                    description: `Server size set to ${newSize}`,
                }
            });
        })
    },
};
