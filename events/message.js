client.on('message', message => {
  if (message.content === '!add') {
	message.channel.send('Added: ${member}')
}
	
