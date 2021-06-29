
const CLOG = console.log

const toEmoji = require('gemoji/name-to-emoji')
const fs = require('fs')

/* List of both human clients and bots */
var clients = []
var bots = []

const emojify = text => {
  return text.replace(/:([^\s\t\n]*):/g, (match, p) => toEmoji[p] || match)
}

const pub2bots = msg => bots.forEach(b => b.message())

fs.readdir('./clients', (err, files) => {
  if (err) {
    CLOG(`Couldn't fetch clients, failed with ${err}`)
    process.exit(1)
  }

  files.forEach(file => {
    const C = require(`./clients/${file}`)
    const client = C(pushMessage)

    if (client) {
      clients.push(client)
    }
  })
})
