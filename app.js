const CLOG = console.log

const toEmoji = require('gemoji/name-to-emoji')
const fs = require('fs')

const emojify = text => {
  return text.replace(/:([^\s\t\n]*):/g, (match, p) => toEmoji[p] || match)
}

// Bots
var bots = []

fs.readdir('./bots', (err, files) => {
  if (err) {
    CLOG(`Couldn't fetch bots, failed with ${err}`)
    process.exit(1)
  }

  files.forEach(file => {
    const bot = require(`./bots/${file}`)
    bots.push(bot)
  })
})

const botReact = (onMessage, message, say) => {
  const response = onMessage(message)
  response && say(emojify(response))
}

const getBotResponses = (callback, message) => {
  bots.forEach(({ messageFilter, onMessage }) => {
    if (message.match(messageFilter)) {
      botReact(onMessage, message, callback)
    }
  })
}

// Clients
fs.readdir('./clients', (err, files) => {
  if (err) {
    CLOG(`Couldn't fetch clients, failed with ${err}`)
    process.exit(1)
  }

  files.forEach(file => {
    const client = require(`./clients/${file}`)
    client(getBotResponses)
  })
})
