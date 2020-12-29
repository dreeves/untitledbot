// FIXME configure host and port
const socket = new WebSocket('ws://localhost:3000')
const socket = new WebSocket(`${protocol}:${window.location.hostname}:${window.location.port}`)
const messageForm = document.querySelector('#message-form')
const messageInput = document.querySelector('#message-input')

socket.addEventListener('open', () => {
    messageInput.disabled = false
})

socket.addEventListener('message', e => {
    const messageLine = document.createElement('li')
    const messageLog = document.querySelector('#chat-log')

    messageLine.textContent = e.data
    messageLog.append(messageLine)
})

messageForm
    .addEventListener('submit', e => {
        e.preventDefault()
        socket.send(messageInput.value)
        messageInput.value = ''
    })
