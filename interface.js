module.exports = function (receiver) {
    receiver.router.get('/', (req, res) => {
        res.sendFile(`${__dirname}/index.html`)
    })
}
