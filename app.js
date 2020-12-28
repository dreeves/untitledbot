const CLOG = console.log

CLOG("Lexiguess initialization...")
const { App, ExpressReceiver } = require("@slack/bolt") // Bolt package: github.com/slackapi/bolt
CLOG("Bolt package loaded, fetching wordlist...")
let   wordlist = require('./data/sowpods.js').wordlist
const dictsize = wordlist.length
const posswords = require('./data/dawords.js').posswords
wordlist = wordlist.concat(posswords)
wordlist = [...new Set(wordlist)] // uniquify
wordlist.sort()
const d = dictsize            // original dict size
const p = posswords.length    // number of possible words to pick for the game
const w = wordlist.length     // size of the augmented dictionary
const n = w-d                 // number of neologisms in the possible words list
CLOG(`Dict: ${d}, Possible words: ${p}, Neologisms: ${n}, Total: ${w}`)

let gametype          // which game to play, lexiguess or buddha nature
let tug               // the user's guess
let tries             // how many tries it takes to guess
let loword            // earliest word in the dictionary it could be
let hiword            // latest word in the dictionary it could be
let daword            // the actual word the bot is thinking of
let introflag         // whether the bot's introduced itself yet
let snarkflag         // whether the bot's said it ignores non-dictionary words
let rangeflag         // whether the bot's said it ignores out-of-range words
let againflag         // whether the bot's said it ignores already guessed words
//let multiflag       // whether the bot's said it ignores multiword messages
let ghash             // things the user already guessed
let prevstring        // exact string user previously typed, for dup detection

// -----------------------------------------------------------------------------
// --------------------------------- Functions ---------------------------------

function splur(n, s, p=null) { return   n===1    ? `${n} ${s}`  // Singular or
                                      : p===null ? `${n} ${s}s` // plural or
                                      :            `${n} ${p}`  // irregular
}                                                               // plural.

function lexireset() {
  daword = posswords[Math.floor(Math.random() * posswords.length)]
  loword = 'aardvark'
  hiword = 'zymurgy'
  tries = 0
  introflag = false 
  snarkflag = false 
  rangeflag = false
  againflag = false
  prevstring = "magic_string_no_user_will_ever_type_so_wont_match_off_bat_547"
  ghash = {}
  CLOG(`We've thought of our word (shhhhh, it's "${daword}")`)
}

// Macro-expand the given blurb, Ruby string interpolation style
function mex(s) {
  return s.replace(/#{tug}/g,        tug)
          .replace(/#{tries}/g,      tries)
          .replace(/#{loword}/g,     loword)
          .replace(/#{hiword}/g,     hiword)
          .replace(/#{daword}/g,     daword)
          .replace(/#{splurtries}/g, splur(tries, "guess", "guesses"))
}

// -----------------------------------------------------------------------------
// ------------------------------ Initialization -------------------------------

let dict = {}
let i = 0
for (const w of wordlist) { 
  if (/[a-z]+/.test(w)) { dict[w] = i++ }
  else { CLOG(`ERROR IN DICT: ${w}`) }
}

lexireset()

const receiver = new ExpressReceiver({ signingSecret: process.env.SLACK_SIGNING_SECRET })
const app = new App({ token:         process.env.SLACK_BOT_TOKEN,
                      receiver
})

// -----------------------------------------------------------------------------
// ---------------------------------- Blurbs -----------------------------------

const introblurb = `\
Hi! I'm the Lexiguess bot. \
I just woke up and remember exactly nothing about anything we may have talked \
about in the past. :blush: \
But I've thought of a (new) word if you want to try guessing it. \
It'll be so fun! \
I picked it from a bunch of words @dreev gave me. \
I'm assuming you typed "*#{tug}*" as your guess, so, here we go! \
Wheeee! :checkered_flag:\n\n`

const againblurb = `\
Hello, McFly, you already guessed "#{tug}". (Ok, I'm shutting up about any repeats now :shushing_face:)`
      
const snarkblurb = `\
I am profoundly ashamed to admit I don’t know the word "#{tug}"! \
(Due to the aforementioned shame, I won't say this again :flushed:)`

const introsnarkblurb = `${introblurb}wait, _uh oh_\n\n${snarkblurb}\n\n`

const snarkrangeblurb = `\
Not only is "#{tug}" not between "#{loword}" and "#{hiword}" in the \
dictionary, as far as I can tell it isn't in the dictionary at all! \
(One of us should probably be pretty embarrassed at this point. \
I shan't speak of this awkwardness -- either words I don't know or words \
outside the current range -- again.)`

const rangeblurb = `\
Ahem, "#{tug}" is not between "#{loword}" and "#{hiword}" in the dictionary! \
From now on you'll get the silent treatment when that happens. \
(I mean, not to be a jerk about it, it's more that I'm assuming you're talking \
about other things and don't want me chiming in unless you're actually \
guessing in-bounds words. :shushing_face:)`

// This one is unreachable?
const rangeagainblurb = `\
Hello, McFly, you already guessed "#{tug}" -- and it's not between \
"#{loword}" and "#{hiword}" anyway. (Ok, I'm shutting up about any repeats or \
out-of-range words now :shushing_face:)`

const gloryblurb = `\
OMG YES, how did you know I was thinking of "#{tug}"! \
[_stamps on floor and falls through_] \
It took you #{splurtries}... \
[_voice fades into abyss_] :hole:`

const gotitblurb = `\
:tada: Yup, my word was "#{tug}"! \
It took you #{splurtries}. :tada:`

const guessblurb = `(#{tries}) My word is between "#{loword}" and "#{hiword}"!`

// -----------------------------------------------------------------------------
// -------------------------- Main Lexiguess Function --------------------------

// Take the string that the user typed and return the bot's response
function lexiguess(x) {
  tug = x
  if (tug === prevstring) {        // exact same thing twice in a row: ignore it
    CLOG(`DUP "${tug}"`)           // (happens sometimes due to network flakage;
    return null                    // if user did it, fine to ignore that too)
  } else { prevstring = tug }
  CLOG(`(${splur(tries, "previous guess", 
                        "previous guesses")}) new guess: "${tug}"`)
  tug = tug.toLowerCase().trim()   // canonicalized word the user guessed
 
  const unk = !(tug in dict)                   // unknown word
  const oor = tug <= loword || tug >= hiword   // out of range
  const rep = ghash[tug]                       // repeated guess
  ghash[tug] = true                            // remember that user guessed tug

  if (!unk && !oor && !rep) {                  // fully valid guess
    tries++
    if (tug === daword) {
      let out
      if (!introflag) {
        CLOG(`INSTAGUESSED "${tug}" in ${tries} try!`)
        out = mex(introblurb + gloryblurb + `\n\n(seriously, 1 guess?)`)
      } else {
        CLOG(`Guessed it ("${tug}") in ${splur(tries, "try", "tries")}!`)
        out = mex(tries < 18.1 ? gloryblurb : gotitblurb)
      }
      lexireset()                 // just wipe our memory and be ready to repeat
      return out
    } else {                      // shrink the range and reply
      if (dict[tug] < dict[daword]) { loword = tug } else { hiword = tug }
      if (introflag){
        return mex(guessblurb)
      } else {
        introflag = true
        return mex(introblurb + guessblurb)        
      }
    }
  } else if (unk && !introflag) {            // unknown word off the bat
    introflag = true
    snarkflag = true
    return mex(introsnarkblurb + guessblurb)
  } else if (oor && !introflag) {            // out of range off the bat: just
    tries++                                  // expand the range and run with it
    if      (tug < loword) { loword = tug }
    else if (tug > hiword) { hiword = tug }
    introflag = true
    return mex(introblurb + guessblurb)
  } else if (rep && !introflag) {            // an airhorn would be nice here
    return `ERROR: First guess was somehow a repeat? This can't happen!`
  } else if (!unk && !oor && rep && !againflag) {         // 1 thing wrong (001)
    againflag = true
    return mex(againblurb)
  } else if (!unk && oor && !rep && !rangeflag) {         // 1 thing wrong (010)
    rangeflag = true
    return mex(rangeblurb)
  } else if (unk && !oor && !rep && !snarkflag) {         // 1 thing wrong (100)
    snarkflag = true    
    return mex(snarkblurb)
  } else if (!unk && oor && rep && !rangeflag && !againflag) { // 2 things (011)
    rangeflag = true
    againflag = true
    return mex(rangeagainblurb)
  } else if (unk && oor && !rep && !snarkflag && !rangeflag) { // 2 things (110)
    snarkflag = true
    rangeflag = true
    return mex(snarkrangeblurb)
  } else if (unk && !oor && rep && !snarkflag && !againflag) { // 2 things (101)
    return `ERROR! Hat-eating commences. Please tell @dreev about this.
You repeated the unknown word "${tug}" yet we didn't already snark at you?!`
  } else if (unk && snarkflag || oor && rangeflag || rep && againflag) {
    return null // Whatever's wrong, we've already given that spiel so ignore it
  }
  // Reasonably sure we can't reach this point in the code...
  return `\
ERROR! Eek! You have found a bug! Please tell @dreev! Diagnostics:
Original string: ${x}
Previous string: ${prevstring}
Canonicalized to: ${tug}
Range: ${loword} [${daword}] ${hiword}
Tries: ${tries}
Unknown word: ${unk}
Out of range: ${oor}
Repeated guess: ${rep}
Previously introduced self: ${introflag}
Previously snarked about non-dictionary words: ${snarkflag}
Previously complained about word out of range: ${rangeflag}
Previously said we wouldn't admonish user about repeats: ${againflag}`
}

// -----------------------------------------------------------------------------
// ------------------------------ Event Handlers -------------------------------

// Someone says a single strictly alphabetic word in a channel our bot is in
app.message(/^\s*([a-z]{2,})\s*$/i, async ({ context, say }) => {
  const l = lexiguess(context.matches[0])
  if (l !== null) await say(l)
})

// Someone clicks on the Home tab of our app; render the page
app.event('app_home_opened', async ({event, context}) => {
  try {
    CLOG(`app_home_opend: ${event.user}`)
    // view.publish is the method to push a view to the Home tab
    const result = await app.client.views.publish({
      token: context.botToken,
      user_id: event.user,             // user who opened our app's app home tab
      view: {               // the view payload that appears in the app home tab
        type: 'home',
        callback_id: 'home_view',
        blocks: [                                            // body of the view
          { "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Welcome to Lexiguess :books:",
            }
          },
          { "type": "divider" },
          { "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `\
Instructions: The bot totally ignores anything that isn't a single word \
(at least 2 letters, no punctuation). \
That's really all you need to know. \
Everything else should be self-explanatory.`,
            }
          },
/*
          { "type": "divider" },
          { "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "If we wanted this button to do anything we could set up "
                +"a listener for it using the `actions()` method and pass its "
                +"unique `action_id`. There's an example in the `examples` "
                +"folder in Glitch.",
            }
          },
          { "type": "actions",
            "elements": [
              { "type": "button",
                "text": { "type": "plain_text",
                          "text": "Click on me!",
          } ] } }
*/
        ]
      }
    })
  }
  catch (error) { console.error(error) }
})

// -----------------------------------------------------------------------------
// ------------------------------- Web Interface -------------------------------

receiver.router.get('/', (req, res) => {
  res.send('Hello, world!')
})

// -----------------------------------------------------------------------------
// ----------------------------- Start the server ------------------------------

;(async () => { 
  await app.start(process.env.PORT || 3000)
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

