const net = require("net")
const constants = require("../constants")

const soldatClient = net.connect(constants.SERVER_PORT, constants.SERVER_IP, function () {
    console.log(`Attempting admin connection with Soldat Server at ${constants.SERVER_IP}:${constants.SERVER_PORT}/${constants.SERVER_ADMIN_PASSWORD}`)
    soldatClient.write(`${constants.SERVER_ADMIN_PASSWORD}\n`)
    console.log("Successfully connected to the Soldat server.")
})

listenForServerResponse = (processData) => {

    const listener = (data) => {
        const read = data.toString();
        console.log(`Received from server: ${read}`)
        if (processData(read)) {
            console.log("Got the data that we wanted, removing listener.")
            soldatClient.removeListener("data", listener)
        }
    }

    soldatClient.addListener("data", listener)

    setTimeout(() => {
        console.log("7 seconds have passed, removing listener.")
        soldatClient.removeListener("data", listener)
    }, 7000)

}

module.exports = {
    soldatClient, listenForServerResponse
}
