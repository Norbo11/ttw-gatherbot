module.exports = (client, message) => {
  if (message.content === '!add') {
	message.channel.send('Added: ${member}')
	
