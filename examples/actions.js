// This example shows how to listen to a button click
// It uses slash commands and actions
// Require the Bolt package (github.com/slackapi/bolt)
const { App } = require("@slack/bolt")

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
})

// Listen for a slash command invocation
app.command('/lex', async ({ ack, payload, context }) => {
  ack() // acknowledge the command request

  try {
    const result = await app.client.chat.postMessage({
      token: context.botToken,
      channel: payload.channel_id, // channel to send message to
      blocks: [ // include a button in the message (or whatever blocks we want!)
        { type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Go ahead. Click it.',
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Click me!',
            },
            action_id: 'button_abc'
          }
        }
      ],
      text: 'Message from Test App' // text in the notification
    })
    console.log(result)
  }
  catch (error) { console.error(error) }
})

// Listen for a button invocation with action_id `button_abc`
// Must first set up a Request URL under Interactive Components on app 
// configuration page
app.action('button_abc', async ({ ack, body, context }) => {
  ack() // acknowledge the button request

  try {
    const result = await app.client.chat.update({ // update the message
      token: context.botToken,
      ts: body.message.ts, // timestamp of message to update
      channel: body.channel.id,
      blocks: [
        { type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*The button was clicked!*',
          }
        }
      ],
      text: 'Message from Test App',
    })
    console.log(result)
  }
  catch (error) { console.error(error) }
})


;(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})()
