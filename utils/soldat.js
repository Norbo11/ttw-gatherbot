const net = require("net")
const constants = require("../constants")

const soldatClient = net.connect(constants.SERVER_PORT, constants.SERVER_IP, function () {
    console.log(`Attempting admin connection with Soldat Server at ${constants.SERVER_IP}:${constants.SERVER_PORT}/${constants.SERVER_ADMIN_PASSWORD}`)
    soldatClient.write(`${constants.SERVER_ADMIN_PASSWORD}\n`)
    console.log("Successfully connected to the Soldat server.")
})


module.exports = {
    soldatClient
}
