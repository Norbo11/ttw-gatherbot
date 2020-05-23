const net = require('net');

module.exports = {
    name: 'map',
    description: 'View or change the current map.',
    execute(message, args) {
        const serconstgs = message.content.slice(1,).split('%');

        const client = net.connect(23075, '51.68.137.225', function () {
            client.write('ttwadmin\n');
            client.write(`/${serconstgs}\n`);

            client.on('data', function (data) {
                    const read = data.toString();
                    const completeData = '';
                    if (read.match(/Map not found/)) {
                        message.channel.send({
                            embed: {
                                color: 3447003,
                                description: "Map not found!",
                            }
                        });
                    }

                    if (read.match(/Initializing bunkers/)) {
                        const args = message.content.slice(5,).split(' ');
                        message.channel.send({
                            embed: {
                                color: 3447003,
                                description: `Map changed to: **${args}**`,
                            }
                        });
                    }

                    setTimeout(function () {
                        client.end();
                    }, 7000);
                }
            );
        })
    },
};
