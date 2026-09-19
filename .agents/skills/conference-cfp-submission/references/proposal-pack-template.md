# Proposal pack template

The deliverable. Produce it as one document the user can paste field by field into the submission form, with every character count shown against the event's cap.

## Table of Contents

- [Shape](#shape)
- [Constraints read from the CFP](#constraints-read-from-the-cfp)
- [Track](#track)
- [Title](#title)
- [Abstract ({N}/{cap} chars)](#abstract-ncap-chars)
- [Takeaways](#takeaways)
- [Outline (reviewer-only)](#outline-reviewer-only)
- [Notes to reviewers ({N}/{cap} chars)](#notes-to-reviewers-ncap-chars)
- [Benefit to the community ({N}/{cap} chars)](#benefit-to-the-community-ncap-chars)
- [Audience level and prerequisites](#audience-level-and-prerequisites)
- [Speaker bio ({N}/{cap} chars)](#speaker-bio-ncap-chars)
- [Supplemental materials](#supplemental-materials)
- [Self-review](#self-review)
- [Before you submit](#before-you-submit)
- [Filled example (abridged)](#filled-example-abridged)
- [Constraints read from the CFP](#constraints-read-from-the-cfp)
- [Track](#track)
- [Title](#title)
- [Abstract (912/1,300 chars)](#abstract-9121300-chars)
- [Takeaways](#takeaways)
- [Outline (reviewer-only)](#outline-reviewer-only)
- [Notes to reviewers](#notes-to-reviewers)
- [Rules for the pack](#rules-for-the-pack)

## Shape

```markdown
# {Event name} - {format}, {duration} - deadline {date}

## Constraints read from the CFP

- Fields: ...
- Caps: title N chars, abstract N chars, ...
- Review: anonymous / named
- Per-person cap: N proposals
- AI policy: ...
- Assumptions (only if something could not be confirmed): ...

## Track

{track name} - {one line on why this track's description matches}

## Title

{chosen title} ({N}/{cap} chars)

Alternatives:

1. ...
2. ...

## Abstract ({N}/{cap} chars)

{published copy, hook → promise → payoff}

## Takeaways

- {verb} ...
- {verb} ...
- {verb} ...

## Outline (reviewer-only)

- 0-4 min - ...
  - ...
- 4-14 min - ...
  - ...
- 14-26 min - ...
- 26-30 min - ...

## Notes to reviewers ({N}/{cap} chars)

{why this speaker, what exists already, what is new here, demo derisking}

## Benefit to the community ({N}/{cap} chars)

{who gains beyond the room, which gap in this programme it fills, why now}

## Audience level and prerequisites

{level} - {what attendees must already know}

## Speaker bio ({N}/{cap} chars)

{third person, 2-3 sentences, one connecting the speaker to this subject}

## Supplemental materials

- Prior talk recording: ...
- Repo / post / benchmark: ...

## Self-review

Content x/5 - ...
Originality x/5 - ...
Relevance x/5 - ...
Speaker x/5 - ...

## Before you submit

- [ ] Rewritten in your own voice
- [ ] Within the per-person submission cap
- [ ] Employer approval, if the recording terms need it
- [ ] Links open in a private window
```

## Filled example (abridged)

Constructed for illustration - "ExampleConf EU" is not a real event and the numbers are invented. Copy the shape, never the content.

```markdown
# ExampleConf EU - session, 30 min - deadline 12 Feb

## Constraints read from the CFP

- Fields: title (75), abstract (1,300), benefit to community (1,000-1,500), outline, bio (400)
- Review: anonymous first round - no employer name in title, abstract or outline
- Per-person cap: 3 proposals
- AI policy: assistance allowed, low-effort generated text rejected

## Track

Operations - the track description asks for "production experience, including what went wrong".

## Title

Cutting a 90-Minute Deploy to Nine Minutes on the Same Cluster (61/75 chars)

## Abstract (912/1,300 chars)

A deploy that takes 90 minutes stops being a deploy and becomes a scheduled event... {full copy}

## Takeaways

- Measure where deploy time actually goes, with no new tooling
- Decide which stages can run concurrently without weakening the rollback path
- Size the risk of removing a verification stage before removing it

## Outline (reviewer-only)

- 0-3 min - the 90-minute deploy and what it cost the team
- 3-12 min - measuring the pipeline: three stages held 70% of the time
  - image build cache misses
  - serialized integration suite
  - manual approval gate
- 12-24 min - the four changes, in the order they shipped, with the one that regressed
- 24-30 min - what we would not do again, and questions

## Notes to reviewers

I own this pipeline and the numbers come from our build records... {full copy}
```

## Rules for the pack

- Show every character count next to its field; a reviewer never sees an over-cap field, the form simply refuses it.
- Never invent an employer, a customer name, a metric, an award or a prior talk. Where the user has not supplied one, write the placeholder as a question to the user, not as filler text in the pack.
- List assumptions at the top when the CFP could not be read, so the user corrects them before submitting.
- Keep the reviewer-only sections textually distinct from the abstract; overlap wastes the argument.
