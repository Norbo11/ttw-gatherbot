const logger = require("../utils/logger")
const utils = require("../utils/commandUtils")
const fs = require('fs');
const mapsFolder = '/home/norbert/ttw/gatherserver/maps/';

module.exports = {
    aliases: ["ttwmaps", "ttwmaplist"],
    description: "See the current maplist",
    execute(client, message, args) {
		const mapsList = fs.readdirSync(mapsFolder).map(mapName => mapName.slice(0, -4)).sort(function (a, b) {
			if ( a.toLowerCase() < b.toLowerCase() ) {
				return -1;
			} else if ( a.toLowerCase() > b.toLowerCase() ) {
				return 1;
			} else {
				return 0;
			}
		} 
		).join(", ");
		message.channel.send({embed: {
			color: 3447003,
			title: "TTW Maps (download mappack)",
			url: "https://soldat-ttw.com/ttw_mappack.zip",
			description: (mapsList)
		}});
    },
};
