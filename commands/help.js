const constants = require("../constants")
const state = require("../utils/gather.js")

module.exports = {
    aliases: ["help"],
    description: "View a list of commands.",
    execute(client, message, args) {
        const helpMessage = client.commands.map((command) => {
            const aliases = command.aliases.map(alias => `${constants.PREFIX}${alias}`)
            return `**${aliases.join(", ")}**: ${command.description}`
        }).join("\n")

        message.channel.send(helpMessage)
    },
};
