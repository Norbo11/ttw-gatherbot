const logger = require("../utils/logger")
const utils = require("../utils/commandUtils")
const fs = require('fs');
const mapsFolder = '/home/norbert/ttw/gatherserver/maps/';

module.exports = {
    aliases: ["ttwmaps", "ttwmaplist"],
    description: "See the current maplist",
    execute(client, message, args) {
		const mapsList = fs.readdirSync(mapsFolder).sort().join(", ");
		message.channel.send({embed: {
			color: 3447003,
			title: "TTW Maplist",
			description: (mapsList)
		}});
    },
};
