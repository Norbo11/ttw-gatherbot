const net = require("net")
const constants = require("../constants")

const soldatClient = net.connect(constants.SERVER_PORT, constants.SERVER_IP, function () {
    soldatClient.write("ttwadmin\n")
    console.log("Successfully connected to the Soldat server.")
})

module.exports = {
    soldatClient
}
