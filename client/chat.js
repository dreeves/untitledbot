// FIXME configure host and port
const socket = new WebSocket('ws://localhost:3000')

socket.addEventListener('open', e => {
    socket.send('Hello server!')
})

socket.addEventListener('message', e => {
    const messageLine = document.createElement('li')
    const messageLog = document.querySelector('#chat-log')

    messageLine.textContent = e.data
    messageLog.append(messageLine)
})

document.querySelector('#user-input')
        .addEventListener('submit', e => {
            e.preventDefault()
            const input = document.querySelector('input[type=text]')
            socket.send(input.value)
            input.value = ''
        })
