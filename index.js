require("dotenv").config()
const Discord = require("discord.js")
const fs = require("fs")
const newclient = new Discord.Client()
const net = require("net")
const client = net.connect(PORT,HOST,function()
var HOST = 'localhost';
var PORT = 23075;

fs.readdir("./events/", (err, files) => { 
	files.forEach(file => {
    const eventHandler = require(`./events/${file}`)
	const eventName = file.split(".")[0]
    client.on(eventName, (...args) => eventHandler(client, ...args))		
  })
})
client.login(process.env.BOT_TOKEN)
