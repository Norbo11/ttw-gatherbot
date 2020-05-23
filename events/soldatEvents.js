const soldat = require("../state/soldat")


soldat.soldatClient.on('data', function (data) {
    const read = data.toString();

    if (read.match(/USER RESET, GATHER RESTART!/)) {
        client.write("/say ggwp\n");
    }
});
