const net = require('net');

module.exports = {
    name: 'gatherstatus',
    description: 'Check the current status of the gather.',
    execute(message, args) {
        const client = net.connect(23075, '51.68.137.225', function () {
            client.write('ttwadmin\n');
            client.write('=== status\n');
            client.on('data', function (data) {
                const read = data.toString();
                const ticks = read.split('---').slice(1).join('---');
                const ticksa = ticks.split(' ')[2];
                const ticksb = ticks.split(' ')[3];
                const capsa = ticks.split(' ')[4];
                const capsb = ticks.split(' ')[5];
                if (read.match(/501 500/)) {
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
                    client.end();
                }
                //	client.end();
            });


        })
    },
};
