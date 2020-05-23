This is inspired by https://hryanjones.com/guess-my-word/ and built with [Bolt](https://slack.dev/bolt).

The `examples` folder has some templates from Slack that might be handy.


See Slack's [Getting Started Guide](https://api.slack.com/start/building/bolt) for their Bolt framework and the 
[Bolt documentation](https://slack.dev/bolt).

(I've spent 10.5 hours on this as of version 1.0.2)

Other bot ideas:

1. wits and wagers (where anyone can contribute numerical facts)
2. codenames where the bot is codemaster by finding synonyms (or synonyms of synonyms if needed) in common between words
3. the coordination game aka the schelling game, which we can already play with just the /bid command
4. boggle (but how to keep the board visible the whole time?)
5. ankified word-of-the-day bot
6. buddha nature where the bot makes up a purely lexical rule, describable with a regex? 

and probably not bottable but there's a great game we play (and we played with the wolf-nixes when they were here) called contact (i don't know why "contact" and probably we should rename it).

PS: having the bot think of the word may not work (humans can ask about words in obscure ways that the bot would have no hope of understanding) but the bot could guess words. like if the letters so far are "ca" it could guess "is it a small domesticated carnivorous mammal with soft fur, a short snout, and retractable claws?"

CHANGELOG

```
2020-04-12: Initial version
2020-04-13: Ignore anything with punctuation or less than 2 letters
2020-04-14: Bugfix with when to complain about out-of-range words
2020-04-14: Bugfix with dups
2020-04-19: Various tweaks and fixes the last few days
```