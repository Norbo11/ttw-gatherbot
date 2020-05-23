

module.exports = (client, message, member, config, prefix) => {
if (message.content === '!add') {
        message.channel.send('Try q!join instead! :)')
}

if (message.content === '!server') {
        message.channel.send({embed: {
		color: 3447003,
		description: "[soldat://51.68.137.225:23075/goaway/](soldat://51.68.137.225:23075/goaway/)",
}});
}

if (message.content === 'q!cap 2') {
	var net = require('net');
	var	client = net.connect(23075, '51.68.137.225',function() {
		client.write('ttwadmin\n');
		client.write('/gathersize 2\n');
		client.write('/restart\n');
		client.end('/say Gather size set to 2\m');
		message.channel.send({embed: {
			color: 3447003,
			description: "Server size set to **2!**",
			}});
})}


if (message.content === 'q!cap 4') {
      //  message.channel.send('q!cap 4')
	var net = require('net');
	var	client = net.connect(23075,'51.68.137.225',function() {
		client.write('ttwadmin\n');
		client.write('/gathersize 4\n');
		client.write('/restart\n');
		client.end('/say Gather size set to 4\n');
                message.channel.send({embed: {
			                        color: 3447003,
			                        description: "Server size set to **4!**",
			                        }});
})}


if (message.content === 'q!cap 6') {
      //  message.channel.send('q!cap 4')
        var net = require('net');
        var     client = net.connect(23075,'51.68.137.225',function() {
                client.write("ttwadmin\n");
                client.write('/gathersize 6\n');
                client.write('/restart\n');
                client.end('/say Gather size set to 6\n');
                message.channel.send({embed: {
			                        color: 3447003,
			                        description: "Server size set to **6!**",
			                        }});
})}

if (message.content === 'q!cap 8') {
      //  message.channel.send('q!cap 4')
        var net = require('net');
        var     client = net.connect(23075,'51.68.137.225',function() {
                client.write("ttwadmin\n");
                client.write('/gathersize 8\n');
                client.write('/restart\n');
                client.end('/say Gather size set to 8\n');
                message.channel.send({embed: {
			                        color: 3447003,
			                        description: "Server size set to **8!**",
			                        }});
})}

if (message.content === 'q!cap 10') {
      //  message.channel.send('q!cap 4')
        var net = require('net');
        var     client = net.connect(23075,'51.68.137.225',function() {
                client.write("ttwadmin\n");
                client.write('/gathersize 10\n');
                client.write('/restart\n');
                client.end('/say Gather size set to 10\n');
                message.channel.send({embed: {
			                        color: 3447003,
			                        description: "Server size set to **10!**",
			                        }});
})}




if (message.content.startsWith('!map ')) {
	  	const servargs = message.content.slice(1,).split('%');
		var net = require('net');
	        var     client = net.connect(23075, '51.68.137.225', function() {
			client.write('ttwadmin\n');
			client.write(`/${servargs}\n`);
			client.on('data', function(data) {
			var read = data.toString();
			var completeData = '';
				if (read.match(/Map not found/)) {
			                message.channel.send({embed: {
						                        color: 3447003,
						                        description: "Map not found!",
						                        }});
						}
				if (read.match(/Initializing bunkers/)) {
                        		const args = message.content.slice(5,).split(' ');
			                message.channel.send({embed: {
						                        color: 3447003,
						                        description: `Map changed to: **${args}**`,
						                        }});
							}
					
				
				setTimeout(function() {
				client.end();
				 	}, 7000);
			}
		);})}


if (message.content === '!gatherstatus') {
	var net = require('net');
	var     client = net.connect(23075, '51.68.137.225', function() {
		client.write('ttwadmin\n');
		client.write('=== status\n');
		client.on('data', function(data) {
		var read = data.toString();
		var ticks = read.split('---').slice(1).join('---');
		var ticksa = ticks.split(' ')[2];
		var ticksb = ticks.split(' ')[3];
		var capsa = ticks.split(' ')[4];
		var capsb = ticks.split(' ')[5];
			if (read.match(/501 500/)) {
				 message.channel.send({embed: {
					                   	color: 3447003,
					                        description: "No gather in progress!",
					                        }});
			} else {
				message.channel.send({embed: {
								color: 3447003,
								description: `**Gather progress**\n :a: **Alpha** tickets: ${ticksa} caps: ${capsa}\n :regional_indicator_b: **Bravo** tickets: ${ticksb} caps: ${capsb}`,
				
								}});
				client.end();
				} 
	//	client.end();
		});
		

})}
}
