const Discord = require('discord.js')
const config = require('./config.json')

const client = new Discord.Client()
console.log('Logging into Discord')
client.login(config.BOT_TOKEN)

module.exports = (getBotResponses) => {
  client.on('message', message => {
    getBotResponses(response => message.reply(response), message.content)
  })
}
