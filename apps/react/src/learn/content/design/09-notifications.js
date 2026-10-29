// System design · lesson 9, case study. Track lang is null: predicts carry an `output` answer.
export default {
  id: 'notifications',
  builds: ['design/queues-and-retries'],
  title: 'Case study: a notification service',
  goal: 'Design one service that sends email, SMS and push for the whole company, reliably, without ever sending twice or letting bulk mail delay urgent messages.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'Step 1: clarify',
      md: `
**The question:** "Design a notification service." Other parts of the company (sign-up, billing, chat from the last lesson) want to tell users things.

**Questions to ask, with typical answers:**

- "Which channels?" Email, SMS, mobile push, and in-app.
- "Do users choose what they get?" Yes, per channel and per type ("no marketing email").
- "Time-sensitive or bulk?" Both: password resets must arrive in seconds; the weekly digest can take an hour.
- "Can it ever send twice?" It shouldn't. A duplicate password reset is annoying; a duplicate "your payment failed" is alarming.

The conclusion: **reliable, no duplicates, urgent messages never wait behind bulk ones.** If that sounds like lesson 5, it is. This design is lesson 5's queue, retries and idempotency, applied to a real system.
`,
    },
    {
      type: 'read',
      title: 'Step 2: the boxes',
      md: `
~~~
[ Other services ] --> [ Notification API ] --> [ Queue ]
                              |                    |
                              v                    v
                      [ Preferences DB ]      [ Workers ]
                                                   |
                    +--------------+---------------+
                    v              v               v
               [ Email ]       [ SMS ]         [ Push ]
              (e.g. SES)     (provider)   (Apple / Google)
                                   |
             workers record every attempt in a delivery log
~~~

- **Notification API:** one front door. It validates the request, checks the user's preferences, writes a record, and **enqueues** a job. Then it returns at once.
- **Workers:** take jobs off the queue and call the right provider.
- **Providers:** the outside services that actually deliver. You don't run your own mail or SMS network.
`,
    },
    {
      type: 'predict',
      title: 'Sending inside the request',
      md: 'An early version sends the email inside the sign-up request.',
      code: `POST /signup
  1. create the user
  2. call the email provider to send "Welcome!"
  3. return 201

Today the email provider is slow: each call takes 10 seconds,
and some calls fail.`,
      output: `Every sign-up takes 10 seconds, and some fail with an error
even though the user was created. Sign-up is now as slow and
unreliable as the email provider.`,
      explain: `
The request now depends on an outside service you don't control. The fix is the lesson 5 rule: **never send from inside the user's request.** Sign-up calls the notification API, which enqueues a job and returns in milliseconds. If the provider is down, the job waits and retries; the user is never affected.
`,
    },
    {
      type: 'read',
      title: 'Step 3: data and API',
      md: `
**Tables:**

~~~
preferences(user_id, channel, type, enabled)
notifications(id, user_id, type, channel, payload,
              status, attempts, idempotency_key UNIQUE,
              created_at, sent_at)
~~~

\`status\` moves through \`queued\`, \`sent\`, and \`failed\`. That table doubles as the **delivery log**: support staff can answer "did the user get the reset email?" with one query.

**API:**

~~~
POST /notifications
{ "user_id": 42, "type": "password_reset",
  "data": { "link": "..." },
  "idempotency_key": "reset:42:2026-10-28T10:00" }
-> 202 Accepted
~~~

\`202\`, because the work isn't done yet (lesson 2). The calling service never says *how* to send. The notification service picks the channels from the type and the user's preferences, and fills in a template per channel.
`,
    },
    {
      type: 'read',
      title: 'Workers, retries and the dead-letter queue',
      md: `
Workers handle the failures, using lesson 5's tools:

- **Retries with exponential backoff and jitter** when a provider times out or returns an error.
- **A maximum number of attempts.** After that, the job goes to a **dead-letter queue** and someone is alerted.
- **Don't retry what can't succeed.** An invalid phone number or an unsubscribed address goes straight to \`failed\`, with no retries.

A provider can also tell you about problems **later**: an email bounces an hour after it was accepted. Providers report these through webhooks, and the service should record them and stop sending to addresses that keep bouncing.
`,
    },
    {
      type: 'predict',
      title: 'The timeout that wasn\'t a failure',
      code: `A worker calls the SMS provider to send a login code.
The provider sends the SMS, but its reply is lost and the
worker times out. The worker treats it as a failure and
the job is retried. There is no idempotency key.`,
      output: `The user gets the same SMS twice. A timeout doesn't mean the
send failed, only that you don't know whether it did.`,
      explain: `
This is the hardest case in any retry design: **unknown outcome**. Retrying is still right, because the message might not have gone out. So the retry must be harmless.

The **idempotency key** does that. The API refuses a second notification with the same key (the \`UNIQUE\` constraint), and workers check the record's \`status\` before sending. Where a provider accepts its own idempotency or de-duplication key, pass yours along so the provider can also drop the repeat.
`,
    },
    {
      type: 'read',
      title: 'Urgent and bulk, kept apart',
      md: `
If everything shares one queue, it's first in, first out for everyone. So separate the traffic:

~~~
[ API ] --urgent--> [ Urgent queue ] --> [ Urgent workers ]
   |
   +----bulk------> [ Bulk queue ]   --> [ Bulk workers ]
~~~

- **Separate queues** by priority, each with its own workers, so a flood in one can't slow the other.
- **Respect provider rate limits.** Email and SMS providers cap how fast you can send. Bulk workers send at a steady rate under that cap (a token bucket from lesson 6 works well), leaving room for urgent traffic.
- **Quiet hours and batching** for non-urgent messages: don't text people at 3 a.m. about a newsletter.
`,
    },
    {
      type: 'predict',
      title: 'One queue for everything',
      code: `At 9:00 marketing enqueues the weekly digest for 2,000,000
users. The workers send about 1,000 messages a second.

At 9:01 a user requests a password reset.
Everything shares one queue.`,
      output: `The reset waits behind roughly 1,940,000 digest jobs, over
half an hour at 1,000 a second. The user gives up long
before the email arrives.`,
      explain: `
2,000,000 jobs at 1,000 a second is about 33 minutes to drain. After one minute, about 60,000 are done, so the reset sits behind the rest. These numbers are made up for the example, but the shape is real: with one shared queue, the biggest batch decides everyone's wait.

Separate queues fix it: the reset goes onto the urgent queue, which is nearly empty, and is sent within seconds.
`,
    },
    {
      type: 'read',
      title: 'Step 5: trade-offs and the 60-second version',
      md: `
**Trade-offs to name:**

- **At-least-once, plus idempotency, instead of exactly-once.** True exactly-once delivery through outside providers isn't something you can guarantee. You get "at least once" from the queue and make duplicates harmless with keys.
- **Accepted is not delivered.** The API returns \`202\` before anything is sent. Callers who need to know the outcome read the status or subscribe to a "notification sent" event.

**Security:** only internal services can call the API (authenticate them), templates escape user data, and payloads that hold personal data are encrypted and kept only as long as needed.

**The 60-second version:** "Services call one notification API, which checks the user's preferences, records the notification with an idempotency key, and enqueues a job, returning 202. Workers send through each provider with retries, backoff and jitter; repeated failures go to a dead-letter queue with an alert. The idempotency key stops a retry from sending twice. Urgent and bulk messages get separate queues so a newsletter can't delay a password reset, and bulk sending is rate-limited under the providers' caps."
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'What does the notification API do before it returns?',
          choices: ['Validates, checks preferences, records the notification and enqueues a job', 'Sends the email and waits for the provider to confirm', 'Nothing; it forwards the request to the provider'],
          answer: 0,
          explain: 'Quick, essential work in the request; slow provider calls in workers.',
          why: { 1: 'That ties the caller to the provider\'s speed and failures.', 2: 'Then there\'s no retry, no preference check and no record.' },
        },
        {
          q: 'A worker times out calling the SMS provider. What do you know?',
          choices: ['Not whether the SMS was sent', 'The SMS was not sent', 'The SMS was sent'],
          answer: 0,
          explain: 'A timeout is an unknown outcome, which is why retries must be idempotent.',
          why: { 1: 'The provider may have sent it and only the reply was lost.', 2: 'It may also have failed; you can\'t tell.' },
        },
        {
          q: 'How do you stop a weekly digest delaying password resets?',
          choices: ['Separate queues and workers for urgent and bulk messages', 'Send the digest faster', 'Add more columns to the notifications table'],
          answer: 0,
          explain: 'Separate queues mean bulk volume can\'t sit in front of urgent jobs.',
          why: { 1: 'Provider rate limits cap how fast you can send.', 2: 'The table isn\'t the bottleneck; the shared queue is.' },
        },
        {
          q: 'An email address has bounced five times. What should the service do?',
          choices: ['Stop sending to it and mark it, based on the provider\'s bounce reports', 'Keep retrying with longer backoff', 'Send from a different provider'],
          answer: 0,
          explain: 'Repeated bounces mean the address is bad, and continuing hurts your sender reputation.',
          why: { 1: 'Retrying can\'t fix a bad address.', 2: 'The address is the problem, not the provider.' },
        },
      ],
    },
  ],
};
