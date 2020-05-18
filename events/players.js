const axios = require("axios");

module.exports = (client, message, member) => {
if (message.content === '!pubplayers') {
axios.get('http://api.soldat.pl/v0/server/51.68.137.225/23074/players')

	.then(response => {
		message.channel.send( response.data );
})}}


