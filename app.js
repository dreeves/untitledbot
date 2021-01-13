const CLOG = console.log

const { App, ExpressReceiver } = require("@slack/bolt") // Bolt package: github.com/slackapi/bolt
const ws = require('ws')

const receiver = new ExpressReceiver({ signingSecret: process.env.SLACK_SIGNING_SECRET })
const app = new App({ token:         process.env.SLACK_BOT_TOKEN,
                      receiver
})

const lexiguess = require('./bots/lexiguess')

app.message(lexiguess.messageFilter, async ({ context, say }) => lexiguess.onMessage({
  message: context.matches[0],
  say
}))
app.event('app_home_opened', lexiguess.onHomeOpened)

// -----------------------------------------------------------------------------
// ------------------------------- Web Interface -------------------------------

const interface = require('./interface')
interface(receiver)

// -----------------------------------------------------------------------------
// ----------------------------- Start the server ------------------------------

const wsServer = new ws.Server({ noServer: true })
wsServer.on('connection', socket => {
  socket.send('Guess the word!')

  socket.on('message', message => {
    if (message.match(lexiguess.messageFilter)) {
      lexiguess.onMessage({
        message,
        say: l => wsServer.clients.forEach(s => s.send(l))
      })
    }
  })
})

process.on('SIGINT', () => {
  CLOG('Shutting down!')
  wsServer.clients.forEach(s => s.send('Server is shutting down! This is most likely a deliberate act by the admin.'))
  process.exit()
})

;(async () => { 
  const server = await app.start(process.env.PORT || 3000)
  server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, socket => {
      wsServer.emit('connection', socket, request)
    })
  })
  CLOG('Lexiguess app is running')
})()

// -----------------------------------------------------------------------------
// ------------------------------- Scratch area --------------------------------

/* #SCHDEL
1st guess, unknown word, repeat, immediate dup, intro/snark/range/again flags
1st unk oor rep dup inf knf raf agf
--- --- --- --- --- --- --- --- ---
                  1                  same thing twice in a row: ignore
X 1   0   0   0       0              normal 1st guess
X 1           1       0              error: can't be a repeat; it's the 1st msg!
X 1   0   1           0              1st guess out of range
X 1   1   0           0              1st guess is an unknown word
X 1   1   1           0              1st guess out of range AND unknown
  0   0   0   0       1              totally normal guess case

X 0   0   0   1       1           0  hello mcfly, you already guessed that
X 0   0   0   1       1              ignore (hello mcfly)
X 0   0   1   0       1       0      ahem, out of range
X 0   0   1   0       1              ignore (ahem, out of range)
  0   0   1   1       1       0   0  out of range AND a repeat
  0   0   1   1       1              ignore
  0   1   0   0       1   0          uknown word
  0   1   0   0       1              ignore
  0   1   0   1       1   0       0  uknown word AND a repeat
  0   1   0   1       1              ignore
  0   1   1   0       1   0   0      uknown and out of range
  0   1   1   0       1              ignore
  0   1   1   1       1   0   0   0  unknown AND out of range AND a repeat
  0   1   1   1       1              ignore

ini: intro upon getting user's first guess
rep: repeated guess of the same word
rng: out of range
unk: unknown word, bot snarks that it's ashamed to not know it
yay: user guesses daword and wins
try: user makes a guess and narrows the range
*/

