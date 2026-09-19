# Worked example: a 30-minute talk outline

The output shape this skill produces, then the same talk structured badly.

## Contents

- Input
- Good outline
- Bad outline, and what each flaw costs

## Input

**Accepted abstract** (25-minute session + 5 minutes Q&A, platform-engineering track, mixed audience of hands-on engineers and staff engineers):

> _Our retry logic took down the payments API._ Retries are the first thing every service adds and the last thing anyone reviews. We rebuilt ours after a 40-minute outage that our own client library caused. You will leave knowing how to tell a safe retry policy from a dangerous one, and how to test the difference before production does it for you.

**Speaker**: platform engineer at the company that ran the outage. Independent of any vendor. Material available: the incident timeline, a load-test harness, before/after latency graphs.

## Good outline

**Arrow** - "A retry policy without a budget is a load amplifier you installed on purpose."

**Arc** - Incident. The audience already retries, but they do not yet believe it is dangerous, and the speaker owns a real outage that proves it.

**Pillars and their evidence**

1. Retries amplify, they do not absorb - the incident's request-rate graph, 3x amplification in 90 seconds.
2. Every safe policy has a budget - the four knobs (cap, jitter, budget, circuit) with the config diff that shipped.
3. You can test this before production does - the load-test harness, run live.

**Moment of realization** - minute 8: the dashboard showing traffic climbing _after_ the dependency recovered. That is when the room stops thinking retries are neutral.

**Time budget**

```
0:00-0:02  hook: the 40-minute outage, in one sentence, with the customer impact
0:02-0:04  promise: how to tell a safe policy from a dangerous one, and who this is not for
0:04-0:10  pillar 1: amplification (timeline + request-rate graph) → realization at 0:08
0:10-0:15  pillar 2: the four knobs, with the config diff
0:15-0:20  pillar 3: testing it (setup + framing)
0:20-0:23  demo: harness reproducing the amplification, then the fixed policy
0:23-0:25  arrow restated, one link slide
0:25-0:30  Q&A
```

Buffer: 3 minutes inside the 25, absorbed by the pillars.

**Slide skeleton** (24 slides; the count is an outcome, not a target)

| #     | Slide must accomplish                            | Notes                                            |
| ----- | ------------------------------------------------ | ------------------------------------------------ |
| 1     | Title + handle                                   |                                                  |
| 2     | "Our retry logic took down payments"             | The hook, no explanation                         |
| 3     | Customer impact in one number                    | 40 min, N failed payments                        |
| 4     | What you'll be able to tell apart afterwards     | The promise                                      |
| 5     | Not for you if: you don't own a client library   | Scope, out loud                                  |
| 6     | Section marker: retries amplify                  |                                                  |
| 7-10  | Timeline, four beats, one per slide              | Each title = what broke                          |
| 11    | Request-rate graph, dependency recovery marked   | The realization; hold it, say nothing for a beat |
| 12    | "Retries amplify, they don't absorb"             | Pillar 1 landed                                  |
| 13    | Section marker: every safe policy has a budget   |                                                  |
| 14-17 | One knob per slide: cap, jitter, budget, circuit |                                                  |
| 18    | The config diff that shipped                     | Highlight changed lines only                     |
| 19    | Section marker: test it before production does   |                                                  |
| 20    | What the harness does, in three lines            |                                                  |
| 21    | DEMO - what to watch: the request-rate line      | Checkpoint: past 0:22, skip the second run       |
| 22    | Before/after latency graphs                      | Insurance if the demo dies                       |
| 23    | The arrow, verbatim from slide 2's promise       |                                                  |
| 24    | Repo + docs + handle                             | Repeats slide 4's link; stays up through Q&A     |

**Cut checkpoints for the speaker notes**

- Past 0:11 at slide 12 → compress pillar 2 to cap + budget, drop jitter and circuit slides.
- Past 0:20 at slide 19 → skip the live demo, show slide 22 instead, keep the arrow.
- Never cut: slides 2, 11, 23.

## Bad outline, and what each flaw costs

```
0:00-0:04  About me, about my company, our stack
0:04-0:07  What is a retry? What is exponential backoff?
0:07-0:12  Live demo of our new retry library
0:12-0:20  Feature tour: cap, jitter, budget, circuit, metrics, tracing, config
0:20-0:26  The outage story
0:26-0:30  Q&A
```

- **Four minutes on the speaker.** Credibility comes from the outage, not the bio. Costs the hook window entirely.
- **Defining exponential backoff to a platform-engineering track.** Below the room's floor - the audience opens laptops.
- **Demo at minute seven.** Nobody believes the problem yet, so it is a product tour of a library they have no reason to want.
- **Features as pillars.** Seven features in eight minutes means none is remembered, and there is no arrow to restate.
- **The outage at minute 20.** The one piece of material the audience cannot get anywhere else arrives when they have stopped listening, and there is no room left for the lesson.
- **Ends on Q&A.** The last thing heard is somebody else's question, not the takeaway.
