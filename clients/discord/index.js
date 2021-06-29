const Discord = require('discord.js')

const client = new Discord.Client()
console.log('Logging into Discord')
client.login(process.env.DISCORD_BOT_TOKEN)

var channels = []

module.exports = pushMessage => {
  client.on('message', message => {
    pushMessage(
      message.author.username,
      message.content
    )

    if (channels.indexOf(message.channel) == -1) {
      channels.push(message.channel)
    }
  })

  return msg => channels.forEach(c => c.send(msg))
}
