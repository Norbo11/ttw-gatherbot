module.exports = (client, message, member) => {
if (message.content === '!add') {
        message.channel.send('Try q!join instead! :)')
}

if (message.content === '!server') {
        message.channel.send('soldat://51.68.137.225:23075/goaway/')
}


if (message.content === 'q!cap 4') {
      //  message.channel.send('q!cap 4')
	var net = require('net');
	var	client = net.connect(23075,'51.68.137.225',function() {
		client.write("ttwadmin\n");
		client.write('/gathersize 4\n');
		client.write('/restart\n');
		client.end('/say Gather size set to 4\n');
		message.channel.send('Server size set to 4!');
})}


if (message.content === 'q!cap 6') {
      //  message.channel.send('q!cap 4')
        var net = require('net');
        var     client = net.connect(23075,'51.68.137.225',function() {
                client.write("ttwadmin\n");
                client.write('/gathersize 6\n');
                client.write('/restart\n');
                client.end('/say Gather size set to 6\n');
                message.channel.send('Server size set to 6!');
})}

if (message.content === 'q!cap 8') {
      //  message.channel.send('q!cap 4')
        var net = require('net');
        var     client = net.connect(23075,'51.68.137.225',function() {
                client.write("ttwadmin\n");
                client.write('/gathersize 8\n');
                client.write('/restart\n');
                client.end('/say Gather size set to 8\n');
                message.channel.send('Server size set to 8!');
})}

if (message.content === 'q!cap 10') {
      //  message.channel.send('q!cap 4')
        var net = require('net');
        var     client = net.connect(23075,'51.68.137.225',function() {
                client.write("ttwadmin\n");
                client.write('/gathersize 10\n');
                client.write('/restart\n');
                client.end('/say Gather size set to 10\n');
                message.channel.send('Server size set to 10!');
})}


}






