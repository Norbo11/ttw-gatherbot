const logger = require("../utils/logger")
const utils = require("../utils/commandUtils")
const fs = require('fs');
const _ = require('lodash');
const mapsFolder = process.env.MAPS_FOLDER;

module.exports = {
    aliases: ["ttwmaps", "ttwmaplist"],
    description: "See the current maplist",
    execute(client, message, args) {
        let sortedMaps = fs.readdirSync(mapsFolder).map(mapName => mapName.slice(0, -4)).sort(function (a, b) {
                if (a.toLowerCase() < b.toLowerCase()) {
                    return -1;
                } else if (a.toLowerCase() > b.toLowerCase()) {
                    return 1;
                } else {
                    return 0;
                }
            }
        )

        sortedMaps = sortedMaps.map(mapName =>
            `[${mapName}](${encodeURI("https://www.soldat-ttw.com/maps/#ttw/" + mapName)})`
        )

        // Discord imposes some character limits on the contents of embeds: https://discord.com/developers/docs/resources/channel#embed-limits
        // To avoid sending a single embed that's too large for it to accept, we spread all the maps across multiple embeds
        // This is still not fool-proof as the batch size of 30 assumes that 30 maps will never be longer than 2048 chars,
        // which may not be the case if there exist some extremely long map names in a batch, but I'm too lazy right now.

        let batchSize = 30;

        for (let x = 0; x < sortedMaps.length; x += batchSize) {
            const mapsBatch = _.slice(sortedMaps, x, x + batchSize)
            const description = mapsBatch.join(", ")

            const embed = {
                color: 3447003,
                url: "https://soldat-ttw.com/ttw_mappack.zip",
                description: description
            }

            if (x === 0) {
                // Only include a title in the first embed
                embed["title"] = "TTW Maps (download mappack)";
            }

            message.channel.send({embed});
        }
    },
};
