require("dotenv").config()
const soldat = require("./state/soldat")

const Discord = require("discord.js")
const fs = require("fs")
const config = require('./config.json')

const client = new Discord.Client()
client.commands = []

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.push(command);
}

fs.readdir("./events/", (err, files) => {
    files.forEach(file => {
        const eventHandler = require(`./events/${file}`)
        const eventName = file.split(".")[0]
        client.on(eventName, (...args) => eventHandler(client, ...args))
    })
})

client.login(process.env.BOT_TOKEN)

// soldat.soldatClient.end()