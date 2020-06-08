require("dotenv").config()
const constants = require("./constants")
const logger = require("./utils/logger")
const Discord = require("discord.js")
const fs = require("fs")
const message = require("./events/message")
const ready = require("./events/ready")

const client = new Discord.Client()
client.commands = []

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.push(command);
}

client.on("message", (...args) => message(client, ...args))
client.once("ready", (...args) => ready(client, ...args))
client.login(process.env.BOT_TOKEN)

cleanUp =  () => {
    logger.log.info("Closing connection to Soldat Server...")
    currentSoldatClient.client.end()
    logger.log.info("Connection successfully terminated.")
    process.exit(0)
}

process.on("SIGINT", cleanUp)

