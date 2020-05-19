module.exports = (newclient, client, message, member) => {
if (message.content === '!add') {
        message.channel.send('Try q!join instead! :)')
}

if (message.content === '!server') {
        message.channel.send('soldat://51.68.137.225:23075/goaway/')
}


if (message.content === '!size4') {
        message.channel.send('q!cap 4')
		client {
		client.write("ttwadmin\n");
		client.write('/gathersize 4\n');
		client.write('/restart\n');
		client.end('/say Gather size set to 4\n');
		message.channel.send('Gather size set to 4!');
})};

}






