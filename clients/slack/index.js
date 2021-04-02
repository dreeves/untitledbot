const { App } = require("@slack/bolt") // Bolt package: github.com/slackapi/bolt

const app = new App({ token: process.env.SLACK_BOT_TOKEN,
                      signingSecret: process.env.SLACK_SIGNING_SECRET })

module.exports = function (getBotResponses) {
  ;(async () => { 
    // TODO assign ports to clients incrementally
    await app.start(process.env.PORT || 3000)
    app.message(async ({ message, say }) => {
      getBotResponses(say, {
        username: message.user,
        message: message.text
      })
    })
  })()
}
