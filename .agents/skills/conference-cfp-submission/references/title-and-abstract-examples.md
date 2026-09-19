# Title, abstract and takeaway examples

Two kinds of example live here. The first section quotes real proposals with their published verdict; everything after it is constructed for contrast, written to isolate one rejection pattern at a time. Use the real ones as the standard and the constructed ones as diagnosis aids.

## Real accepted proposals

Both are published on speakerline.io, which shows each proposal's submitted text and whether it was accepted.

**"Adopting Sorbet at Scale" - Ufuk Kayserilioglu, RubyConf 2019, accepted.** The abstract's first line is nothing but production scale:

> Shopify is a platform used by 800K merchants generating 12B$ revenue per year, serving 80K requests per second. Our core monolith is a 21K file Ruby on Rails application modified by 800 PRs per day.

Four numbers before the subject is even named. The reviewer-only pitch then carries what the abstract never claims: the speaker led the adoption and wrote the tooling the talk describes. That split - scale in the abstract, standing in the pitch - is the pattern to copy.

**"Access Denied: the missing guide to authorization in Rails" - Vladimir Dementyev, RailsConf 2018, accepted.** No metrics anywhere. It wins on a named gap in the ecosystem (the framework ships no authorization layer) and on enumerating the decisions the talk resolves: where authorization belongs, activity-based versus role-based, what existing libraries do and do not cover.

The pair matters: a numbers-first opening is the strongest default, not a rule. A proposal with no metrics still lands when it names a gap the audience recognises and commits to resolving specific decisions.

## Constructed weak/strong pairs

Weak and strong versions of the same material. The weak column is not a straw man - each one is a real rejection pattern, but the text itself was written for this skill, not taken from a submitted proposal.

### Titles

| Weak                                    | Strong                                                                      | Why                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Building Better APIs                    | Three API Changes That Broke 40 Downstream Teams                            | Names the stake and the scale                                                          |
| Our Kubernetes Journey                  | Cutting a 90-Minute Deploy to Nine Minutes on the Same Cluster              | Before and after, both measured                                                        |
| Is Your Observability Strategy Working? | We Paid for 12 TB of Logs and Used 400 GB                                   | Declarative beats interrogative, and the gap between the two figures is the whole talk |
| Developer Experience: A Deep Dive       | The Onboarding Step That Cost Us Half Our New Hires' First Week             | The colon version front-loads a vague category                                         |
| Scaling with Acme Cloud Run             | Running 400 Batch Jobs an Hour Without a Scheduler                          | Vendor-neutral rooms reject the product framing                                        |
| Rollback to the Future                  | Rollback to the Future: Undoing a GitOps Deploy the Cluster Kept Reapplying | A pun is fine when the rest of the title still says what the talk is                   |

### Abstracts

The same 30-minute talk, both versions inside a 1,000-character budget.

**Weak - speaker-centric, vague, no evidence**

> In this talk I'll walk you through our migration journey from a monolith to microservices. I'll share what we tried, what failed along the way, and what we eventually got right. We'll look at some of the architectural choices we made and the lessons we learned as a team. By the end, you'll have a good sense of how we approached the problem and you'll understand the trade-offs involved in this kind of migration.

Failures:

- Every sentence describes the speaker's activity.
- No number.
- "You'll understand" is not a takeaway.
- Nothing distinguishes it from fifty other migration talks.

**Strong - attendee-centric, specific, structured**

> Splitting a monolith usually fails in the same place: the database. Three services later, our team was running distributed transactions by hand and losing orders during deploys. This session walks through the two months that followed - the boundary we drew wrong, the outbox pattern that fixed writes but not reads, and the three-week freeze we could have avoided by moving the data before the code. Attendees leave able to sequence a decomposition around data ownership rather than service boundaries, spot the two failure signatures that mean the split came too early, and price the freeze honestly before proposing one.

Why it works: the hook is a recognisable failure, the middle names a concrete sequence, the payoff is three actions, and the whole thing reads as something only this team could have written.

### Takeaways

| Weak                                                     | Strong                                                                      |
| -------------------------------------------------------- | --------------------------------------------------------------------------- |
| Understand how observability fits into your architecture | Choose which three signals to instrument first on a service you already run |
| Learn about the trade-offs of event-driven systems       | Price the operational cost of a broker before proposing one                 |
| Gain insight into database migrations                    | Sequence a zero-downtime column rename in a table with active writes        |
| Appreciate the importance of documentation               | Run a docs cold-start test with a colleague in under an hour                |

### Reviewer-only text

The notes field is where the sentences that would sound arrogant in published copy belong.

**Weak (copy-pasted abstract)**

> This talk covers our migration from a monolith to microservices and the lessons we learned.

**Strong (argues the case)**

> I led this migration and still own the services. The numbers in the abstract come from our incident record, and I can share the anonymised timeline. Last year's programme had two talks on decomposition strategy, both from the design side - this one is the operational aftermath, including the freeze we mishandled. No product is discussed; the tooling is open source and linked.

### Opening lines to cut on sight

- "At Acme, we believe…" - the employer's name in the first four words.
- "Have you ever wondered why microservices are hard?" - a question the talk never answers.
- "My journey into platform engineering started in 2019…" - the speaker's biography instead of the attendee's problem.
- "Kubernetes is a container orchestration system…" - defining a term the audience knows.
- "In today's fast-paced cloud-native landscape…" - a sentence carrying no information.
