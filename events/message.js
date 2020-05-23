PREFIX = "!"

module.exports = (client, message) => {

    // Do not process messages that don't start with our prefix, or come from a bot
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).split(/ +/);
    const command = args.shift().toLowerCase();

    if (!client.commands.has(command)) return;

    try {
        console.log(`${message.author.username}: ${message.content}`)
        client.commands.get(command).execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
}
