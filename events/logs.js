var net = require('net');
client = net.connect(23075, '51.68.137.225',function() {
	    console.log('connected to server!');
	    client.write("ttwadmin\n");
});

client.on('data', function(data) {
	var read = data.toString();
	var completeData = '';

	if (read.match(/USER RESET, GATHER RESTART!/)) {
		client.write("/say ggwp\n");

}});
	    



