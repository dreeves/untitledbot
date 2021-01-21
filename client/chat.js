window.addEventListener('load', () => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const socket = new WebSocket(`${protocol}:${window.location.hostname}:${window.location.port}`)
    const messageForm = document.querySelector('#message-form')
    const messageInput = document.querySelector('#message-input')

    socket.addEventListener('open', () => {
        messageInput.disabled = false
        messageInput.focus()
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
})
