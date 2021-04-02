const Discord = require('discord.js')

const client = new Discord.Client()
console.log('Logging into Discord')
client.login(process.env.DISCORD_BOT_TOKEN)

module.exports = (getBotResponses) => {
  client.on('message', message => {
    getBotResponses(response => message.reply(response), {
      username: message.author.username,
      message: message.content
    })
  })
}
