console.log("Lexiguess initialization...")
const { App } = require("@slack/bolt") // Bolt package: github.com/slackapi/bolt
console.log("Bolt package loaded, fetching wordlist...")
// make sure wordlist only has words between 'aardvark' and 'zymurgy'
let   wordlist  = require('./data/sowpods.js').wordlist
const dictsize = wordlist.length
const posswords = require('./data/dawords.js').posswords
wordlist = wordlist.concat(posswords)
wordlist = [...new Set(wordlist)]
wordlist.sort()
const d = dictsize         // original dict size (from aardvark to zymurgy)
const p = posswords.length // number of possible words to pick for the game
const w = wordlist.length  // size of the augmented dictionary
const n = w-d              // number of neologisms in the possible words list
console.log(`Dict: ${d}, Possible words: ${p}, Neologisms: ${n}, Total: ${w}`)

let tug               // the user's guess
let tries             // how many tries it takes to guess
let loword            // earliest word in the dictionary it could be
let hiword            // latest word in the dictionary it could be
let daword            // the actual word the bot is thinking of
let introflag         // whether the bot's introduced itself yet
let knownflag         // whether the bot's said it ignores non-dictionary words
let rangeflag         // whether the bot's said it ignores out-of-range words
let againflag         // whether the bot's said it ignores already guessed words
//let multiflag       // whether the bot's said it ignores multiword messages
let ghash             // things the user already guessed
let prevstring = "magic_string_no_user_will_ever_type_1547"

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
  knownflag = false 
  rangeflag = false
  againflag = false
  ghash = {}
  console.log(`We've thought of our word (shhhhh, it's "${daword}")`)
}

// Do macro substitution on the given blurb, Ruby string interpolation style
function macsub(s) {
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
  else { console.log(`ERROR IN DICT: ${w}`) }
}

lexireset()

const app = new App({ token:         process.env.SLACK_BOT_TOKEN,
                      signingSecret: process.env.SLACK_SIGNING_SECRET,
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

const knownblurb = `
I am profoundly ashamed to admit I don’t know the word "#{tug}"! \
(Due to the aforementioned shame, I won't say this again :flushed:)`

const rangeblurb = `\
Ahem, "#{tug}" is not between "#{loword}" and "#{hiword}" in the dictionary! \
From now on you'll get the silent treatment when that happens. \
(I mean, not to be a jerk about it, it's more that I'm assuming you're talking \
about other things and don't want me chiming in unless you're actually \
guessing in-bounds words. :shushing_face:)`

const gloryblurb = `\
OMG YES, how did you know I was thinking of "#{tug}"! \
[_stamps on floor and falls through_] \
It took you #{splurtries}... \
[_voice fades into abyss_] :hole:`

const guessblurb = `(#{tries}) My word is between "#{loword}" and "#{hiword}"!`

/*
1st guess, unknown word, repeat, immediate dup, intro/known/range/again flags
1st unk oor rep dup inf knf raf agf
--- --- --- --- --- --- --- --- ---
                  1                  same thing twice in a row: ignore
  0                   0              error: introflag never set
  1                   1              error: introflag set prematurely
  1   0   0   0       0              normal 1st guess
  1           1       0              error: can't be a repeat; it's the 1st msg!
  1       1           0              error: 1st guess out of range
  1   1               0              1st guess is an unknown word
  0   0   0   0       1              totally normal guess case
  0   0   0   1       1           0  hello mcfly, you already guessed that
  0   0   0   1       1              ignore (hello mcfly)
  0   0   1   0       1       0      ahem, out of range
  0   0   1   0       1              ignore (ahem, out of range)
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
*/

// -----------------------------------------------------------------------------
// ------------------------------ Event Handlers -------------------------------

// Someone says a single strictly alphabetic word in a channel our bot is in
app.message(/^\s*([a-z]{2,})\s*$/i, async ({ context, say }) => {
  tug = context.matches[0]         // exact string the user guessed
  if (tug === prevstring) {        // exact same thing twice in a row: ignore it
    console.log(`DUP "${tug}"`)    // (happens sometimes due to network flakage;
    return                         // if user did it, fine to ignore that too)
  } else { prevstring = tug }
  tug = tug.toLowerCase()          // canonicalized word the user guessed
  console.log(`(${splur(tries, "previous guess", 
                               "previous guesses")}) new guess: "${tug}"`)
 
  
  if (ghash[tug]) {                // already guessed x
    if (!againflag) {
      againflag = true
      await say(macsub(againblurb))
    }
    return                         // ignore it
  } else {
    ghash[tug] = true              // remember that they said it and continue
  }

  if (!(tug in dict) && !introflag) { // off the bat with unknown word
    await say(macsub(
      `${introblurb}um... _uh oh_\n\n${knownblurb}\n\n${guessblurb}`))
    knownflag = true
    introflag = true
    return                         // ignore it
  }
  
  if (tug <= loword || tug >= hiword) { // out of range
    if (!rangeflag) {
      rangeflag = true
      await say(macsub(rangeblurb))
    }
    return                         // ignore it
  }
  
  if (!(tug in dict)) {              // unknown word
    if (!knownflag) {
      knownflag = true
      await say(macsub(knownblurb))
    }
    return                         // ignore it
  }
  
  tries++           // if we made it this far then tug is actually a legit guess
  if (tug === daword) { 
    await say(macsub(gloryblurb))
    console.log(`Guessed it ("${tug}") in ${splur(tries, "try", "tries")}!`)
    lexireset()                   // just wipe our memory and be ready to repeat
    return
  }
  if (dict[tug] < dict[daword]) { loword = tug } else { hiword = tug }
  if (!introflag) {
    introflag = true
    await say(macsub(introblurb + guessblurb))
  } else {
    await say(macsub(guessblurb))
  }
})


// Someone clicks on the Home tab of our app; render the page
app.event('app_home_opened', async ({event, context}) => {
  try {
    console.log(`app_home_opend: ${event.user}`)
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
              "text": "Welcome to Lexiguess :tada: :books:",
            }
          },
          { "type": "divider" },
          { "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Just a silly weekend project by dreev. "
                +"Instructions: The bot totally ignores anything that isn't a "
                +"single word. That's really all you need to know. Everything "
                +"else should be self-explanatory.",
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


;(async () => { 
  await app.start(process.env.PORT || 3000)
  console.log('Lexiguess app is running')
})()
