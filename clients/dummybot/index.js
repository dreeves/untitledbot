const messageFilter = /dummy/i

module.exports = pushMessage => {
    return msg => {
        if (msg.match(messageFilter)) {
            pushMessage('I beg your pardon!')
        }
    }
}
