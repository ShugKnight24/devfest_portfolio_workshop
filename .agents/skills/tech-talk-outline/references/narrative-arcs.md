# Narrative arcs for technical talks

Six arcs that hold a technical audience, plus the one to avoid. Pick with the speaker, do not assign silently - the arc decides which material survives.

## Contents

- Choosing an arc
- 1. Problem → dead ends → insight → proof
- 2. Incident
- 3. Migration (before/after)
- 4. Progressive construction
- 5. Contrarian
- 6. Sparkline (what is / what could be)
- Anti-pattern: the feature tour
- Named methods worth citing

## Choosing an arc

First, the gate: three questions decide which arcs are even available. Delete the ones that fail - do not present an arc the speaker cannot deliver and then rank it last, because a shortlisted impossibility comes back as a week of wasted drafting.

1. **What raw material exists?** An incident, a benchmark, a migration and a from-scratch implementation each already imply an arc. No outage, no incident arc. Do not invent a narrative the speaker cannot source.
2. **What does the audience already believe?** If they agree the problem exists, skip to the insight (arcs 3, 4). If they do not, the talk must earn the problem first (arcs 1, 2). If they believe the opposite, the talk is contrarian (arc 5) - and an audience that already agrees rules that arc out entirely.
3. **What is the slot?** Lightning slots hold one movement only, which removes both the sparkline and progressive construction. Keynotes tolerate the sparkline, but a 25-minute technical session usually does not.

Then rank what survived by belief moved per hour of preparation, not by which is easiest to draft - that is how a speaker ends up with a migration talk that convinces nobody:

- efficiency: incident > migration > problem → dead ends → insight > contrarian > sparkline > progressive construction
- effort: incident == migration (both are recall: the speaker lived it, and the work is selection and ordering rather than invention) > problem → insight (the dead ends have to be reconstructed and each one verified) > sparkline (an alternating structure that has to be written and rehearsed as a single piece) > contrarian (demands stronger evidence than any other arc, because every claim will be attacked) > progressive construction (every step must work live, and it eats most of the deck)
- value: progressive construction (the audience can rebuild the thing afterwards - the deepest transfer available) > contrarian (changes a belief the room walked in with) > incident (credibility no other arc buys: the speaker was there and admits what they got wrong) > problem → insight (transfers a technique) > migration (maps onto the audience's actual week) > sparkline (moves belief without handing over anything executable)

No compliance-cost axis applies to the choice of arc. It reappears in the material: an incident arc needs externally-visible detail cleared with whoever owns it before the slot, and that is a gate on the evidence, not a cost of the structure.

Efficiency starves progressive construction - the highest-value arc on the list and the most expensive to rehearse, so it loses every round and speakers default to safer shapes. Promote it when these hold together: a long slot, weeks of rehearsal time, and a subject that genuinely assembles in steps. A workshop-adjacent session is exactly its case.

This order is a default, not a law, and it shifts with who is giving the talk. Re-rank against what you know about this speaker:

- Someone who teaches for a living pays far less for progressive construction than the ranking assumes.
- Someone re-giving the talk at four events amortizes any expensive arc across all of them.
- A speaker whose only real asset is one spectacular outage has an incident arc that outranks everything regardless of ratio.

## 1. Problem → dead ends → insight → proof

The default for a technical argument.

Shape: the problem, made concrete with a number → the obvious fixes and exactly why each one fails → the insight that unlocks it → evidence it works → the arrow restated.

Why it holds: walking the audience through the dead ends is what earns the insight. Skip them and the insight sounds obvious, so the audience concludes they already knew it.

Trap: spending so long on dead ends that the insight arrives with four minutes left. Cap the dead ends at one third of the body.

## 2. Incident

Shape: the system as it was believed to work → the timeline of the failure → the moment the belief broke → what actually changed afterwards (code, process, architecture) → what generalizes.

Why it holds: incidents carry built-in tension and the speaker is unambiguously credible about their own outage. Engineers trust a talk that admits what its authors got wrong more than one that shows a system working.

Trap: turning the timeline into the whole talk. The timeline is a pillar, not the arc - the generalizable lesson is what the audience is there for. Also, clear externally-visible incident detail with whoever owns it before the slot.

## 3. Migration (before/after)

Shape: the old system and the constraint that made it untenable → the forcing function → the options considered → the new system → the real cost, including what got worse.

Why it holds: an audience mostly maintains existing systems. A migration story maps onto their week better than a greenfield design.

Trap: omitting what got worse. Every migration trades something away, and a talk that reports only gains reads as marketing and gets attacked in Q&A.

## 4. Progressive construction

Shape: build the thing from nothing on stage - a parser, a scheduler, a protocol client - adding exactly one concept per step, each step working.

Why it holds: the audience derives the design instead of being shown it, so they can rebuild it later.

Trap: the pace. Each step needs a visible working state, and three concepts introduced in one step lose the room permanently. This arc also consumes slide budget fast - reserve most of the deck for it.

## 5. Contrarian

Shape: state the received wisdom fairly, in its strongest form → the evidence against it → the boundary where it does hold → the replacement rule.

Why it holds: it earns attention immediately, and steelmanning the received wisdom is what stops the room from becoming defensive.

Trap: a weak version of the opposing view. If the audience recognizes a strawman, the talk is over - and this arc requires stronger evidence than any other, since the audience starts out disagreeing.

## 6. Sparkline (what is / what could be)

Nancy Duarte's structure from _Resonate_: open in the ordinary world ("what is"), alternate repeatedly between what is and what could be, and end on the new normal rather than a summary. The gap between the two states is what creates momentum.

Use it for keynotes, ecosystem talks and vision slots - anywhere the goal is a change in belief rather than a transferable technique.

Trap: it needs a real gap. Applied to a 25-minute how-to talk it inflates a modest technique into a manifesto, which a technical audience reads as a pitch.

## Anti-pattern: the feature tour

"Here is our product, here are its features, in menu order." It has no tension, no arrow, and nothing to remember. The only legitimate version is a release keynote, where the audience explicitly came for the list.

The fix is mechanical: make the problems the pillars and demote each feature to evidence under the problem it solves. If a feature has no problem to sit under, it does not belong in the talk.

## Named methods worth citing

- **Bow and Arrow** (Tristan de Montebello): the arrow is the one sentence the audience remembers, and the bow is the two or three stories, numbers and illustrations that give it force. Applies to the whole talk and to each slide - including the trick of writing the slide title as its takeaway.
- **The 5-Second Moment** (Matthew Dicks): every story turns on a single moment of transformation or, more often, realization - "I used to think X, now I think Y". In a technical talk this is the benchmark that contradicted the team, or the outage that killed the architecture.
- **The Accordion Method** (Tristan de Montebello): compress the talk to 3, 2, 1 and 0.5 minutes, then expand back up. What survives the shortest rep is the talk, and what reappears on the way up is the cut list, in cut order.
- **Inside outlining** (Zach Holman, speaking.io): write the main sections first and resist fleshing them out, then add one or two supporting points per section, then at most a third tier. Three sections is his default, and he treats the outline as "a point to channel my thoughts, _not_ as the verbatim bible of my talk".
