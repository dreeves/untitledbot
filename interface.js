const express = require('express')

module.exports = function ({ app }) {
    app.get('/', (req, res) => {
        res.sendFile(`${__dirname}/index.html`)
    })

    app.use('/static', express.static('client'))
}
