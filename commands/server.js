module.exports = {
    name: 'server',
    description: 'Get the IP address of the server.',
    execute(message, args) {
        message.channel.send({
            embed: {
                title: "Server Info",
                color: 0xff0000,
                fields: [{
                    name: "Link",
                    value: "soldat://51.68.137.225:23075/goaway",
                    inline: true
                }]
            },
        }).catch((e) => console.error(e.response.body))
    },
};
