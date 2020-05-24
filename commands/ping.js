module.exports = {
    aliases: ["ping"],
    description: "Ping!",
    execute(client, message, args) {
        message.channel.send("Pong.");
    },
};
