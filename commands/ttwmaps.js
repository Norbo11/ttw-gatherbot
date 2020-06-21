const logger = require("../utils/logger")
const utils = require("../utils/commandUtils")

module.exports = {
    aliases: ["ttwmaps"],
    description: "See the current maplist",
    execute(client, message, args) {
        message.channel.send({embed: {
              color: 3447003,
              title: "TTW Maplist",
              description: "ttw_42ndWood, ttw_afterGlory, ttw_Alize, ttw_alphathing, ttw_Anoxi, ttw_Autumn, ttw_Bachvu, ttw_BattleField, ttw_Borderwars, ttw_Bridge, ttw_cadet, ttw_Cangaceiros, ttw_castle, ttw_Cathedral, ttw_ColdMorning, ttw_Concrete, ttw_crater, ttw_crecent, ttw_Creek, ttw_crimson, ttw_Dawn, ttw_desert, ttw_Drain, ttw_El_Alamein, ttw_Forest, ttw_Forgotten, ttw_Fort, ttw_fortress, ttw_frost, ttw_Frostbite, ttw_generic, ttw_Gloryhill, ttw_hue, ttw_Junkyard, ttw_kaibatsu, ttw_kamiquasi, ttw_Kampfer, ttw_Krath, ttw_Limbo, ttw_marsh, ttw_meteorite, ttw_Mound, ttw_Mudder, ttw_Myst2, ttw_Nightfall, ttw_Nomans, ttw_nworld, ttw_paperwar, ttw_Pinewood, ttw_Plat, ttw_Rage, ttw_rime, ttw_rover, ttw_shaft, ttw_Skybridge, ttw_SoldiersFoly, ttw_Steroids, ttw_storm, ttw_Struggle, ttw_Take, ttw_Teroya, ttw_Toxic2, ttw_Trainyards, ttw_Valley, ttw_Verdun, ttw_Village2, ttw_Waste, ttw_Ypres_n"
}});
    },
};
