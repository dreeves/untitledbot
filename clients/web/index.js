const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const ws = require('ws')

const wsServer = new ws.Server({ server })

const dispatchResponse = (message) => {
    wsServer.clients.forEach(s => s.send(message))
}

module.exports = function (getBotResponses) {
    app.get('/', (req, res) => {
        res.sendFile(`${__dirname}/index.html`)
    })

    app.use('/static', express.static(`${__dirname}/static`))

    wsServer.on('connection', (socket, req) => {
        socket.on('message', message => {
            getBotResponses(dispatchResponse, message)
        })
    })

    server.listen(3001)
}
