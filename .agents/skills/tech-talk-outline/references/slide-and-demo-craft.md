# Slide and demo craft for a technical talk

Craft rules for the artifacts the outline produces: the slide skeleton, the code slides, and what the audience sees on screen during the demo. Reliability engineering for the demo itself is a different job - this file only covers what is legible and what is remembered.

## Contents

- Slide count is an outcome, never a target
- Writing a slide's job into the skeleton
- Code on slides
- Room legibility
- Accessibility
- Demo legibility on stage
- The deck's second life
- Skeleton checklist

## Slide count is an outcome, never a target

There is no slides-per-minute rule, and skills that invent one optimize the wrong variable. A story-led talk can run on three slides. A dense technical talk can run a hundred in thirty minutes with two words on each, flipping ten in twenty seconds through a joke and then holding one for five minutes.

Emit an ordered list of what each slide must accomplish, and let the count fall out of it. If the speaker asks for a number anyway, tell them the count they end up with after the first timed run is the correct one.

## Writing a slide's job into the skeleton

Each entry in the skeleton names a job, not a design. "Request-rate graph with the dependency recovery marked; hold it silently for a beat" is a job. "Nice chart" is not.

- Give every section a marker slide. A listener who drifted for ninety seconds needs a visible door back into the talk, and a three-pillar talk has exactly three of them.
- Mark the slides that must never be cut - usually the hook, the moment of realization, and the arrow. Everything else is negotiable under time pressure.
- Attach the timing checkpoint to the slide it belongs to, so the speaker notes and the deck stay in sync when a slide moves.
- Put a slide's evidence next to the claim it supports. A number two slides away from the assertion it proves reads as decoration.

## Code on slides

- Show the smallest fragment that carries the point, never a full file. Cut imports, elide bodies with ellipses - a conference audience forgives both and thanks you for them.
- Highlight the changed lines instead of asking the room to mentally diff two dense slides.
- Never read code aloud line by line. Say what it does, then point at the one line that matters.
- One code slide should teach one thing. If it needs two sentences of setup and two of payoff, it is two slides.
- Prefer a diagram over code when the point is structure, and code over a diagram when the point is a specific API call or an exact failure.

## Room legibility

- Terminal text at 24pt or larger, editor text at 20pt or larger - practitioner convention repeated across speaking guides, not a measured threshold. The back row and the recording crop are what it protects.
- Use a high-contrast theme. A dark theme that looks sharp on a laptop is often unreadable on a washed-out projector, and daytime slots are usually the bright rooms.
- Assume a 16:9 screen with the bottom sixth blocked by heads or a lower-third banner. Nothing load-bearing lives there.
- Check the room's throw distance if the schedule allows - a talk designed for a 300-seat hall wastes its detail in a 40-seat side room, and vice versa.

## Accessibility

- Never convey meaning by color alone. Red/green diffs lose color-blind attendees and bad projectors alike - add a `+`/`-`, a label, or a shape.
- Say out loud what a graph shows before discussing it. Attendees at the back, in a live-caption feed, or listening to the recording on headphones all depend on the narration.
- Keep animation minimal and purposeful - per-word builds slow the talk and break screen readers of the published deck.
- Write image alt text into the published version of the deck, not just the on-stage one.

## Demo legibility on stage

- Zoom the terminal and editor before walking on, not during. Adjusting font size live burns 30 seconds and signals unpreparedness.
- Hide the noise: notifications off, tabs closed, secrets purged, shell prompt shortened, browser bookmarks bar cleared.
- Say what to watch before starting ("watch the p99 line, not the log output"). An unnarrated demo reads as filler even when it works.
- Narrate the waiting. A silent 20-second build feels like a failure to the room, so say what is happening and why it takes that long.
- Keep one slide of "what you just saw" immediately after the demo, so the point survives even if the demo half-worked.

## The deck's second life

Most conference talks are recorded and published, and the slides usually get uploaded separately. Consequences for the skeleton:

- Every slide must survive being screenshotted out of context. No "as I said earlier" references, and no critical information delivered only verbally over a visually empty slide.
- Put the repository link, docs link and speaker handle on a slide that appears twice: once at the point it becomes useful, once at the end where it gets paused and photographed. A link that appears only in the final five seconds is a link nobody captures.
- Export a PDF fallback before travelling. Presentation software failing on someone else's machine is routine, not exotic.

## Skeleton checklist

Before handing the skeleton over, verify:

- Every slide has one idea, and its title is the takeaway sentence rather than a topic label.
- Nothing is on screen that the speaker is not about to say.
- Each section has a marker slide, and the never-cut slides are marked.
- Every code fragment passes the font-size and highlight-the-diff rules.
- No meaning depends on color alone.
- The link slide appears twice, and the final slide stays up through Q&A.
