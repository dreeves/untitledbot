const CLOG = console.log

const toEmoji = require('gemoji/name-to-emoji')
const fs = require('fs')
const { generateSlug } = require('random-word-slugs')

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

const emojify = text => {
  return text.replace(/:([^\s\t\n]*):/g, (match, p) => toEmoji[p] || match)
}

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

// -----------------------------------------------------------------------------
// ---------------------------------- Clients ----------------------------------

const slack = require('./clients/slack')
slack(getBotResponses)

const web = require('./clients/web')
web(getBotResponses)

const discord = require('./clients/discord')
discord(getBotResponses)


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

