/**
 * Michigan DevFest 2026 — the one-hour talk.
 * Date: November 14, 2026 — Google GDG Detroit
 *
 * ONE DECK, run as a conversation: no time ceiling, questions any time. No
 * runtime picker, nothing to fumble with the lights in your eyes. It is
 * chapter two of "Pull the Cord. Bring Backup." (September 19), cut to the
 * notes with the most impact and the parts of the agent hype nobody puts on
 * the poster — the perception gap, the context only you have, skills worth
 * installing, and the blast radius of an agent holding your keys.
 *
 * The argument, in one breath: with AI you can build more than ever, and more
 * garbage than ever. Fundamentals tell them apart. A chainsaw (Denji), a
 * drifter (Reacher) and a swordsman (Musashi) carry it:
 *
 *   PRE-SHOW    IRIS OUT, then the Reze arc in story order, ending on slow
 *               summer eve: the fireworks, the kiss, the snap, BOOM.
 *   OPENING     Who is talking, the title, then the three stories it covers
 *               (Denji, Reacher, Musashi). A conversation, not a lecture:
 *               hands up any time.
 *   COLD OPEN   Power in the Blood pulls Pochita's cord. Who Denji is. Pull the
 *               cord: don't wait until you're ready. Pochita asks for his dream,
 *               KICK BACK is the fight that follows, and we ask for yours.
 *   HOW YOU LOOK AT IT  One mountain, seen from the valley, from above, from its
 *               summit and from home: your perspective is the judge. Hype and doom
 *               are two views of it, and value is what holds either way; there is always
 *               a next mountain (celebrate it, then choose the next one on purpose);
 *               city mouse or country mouse (your dream decides your actions).
 *               More output, more garbage: what are you building, and for whom? Feeling fast is not being fast.
 *               Musashi: you already have a Way.
 *   ACT I       Read the Scene        — who Reacher is, Police Dog Blues (why he
 *                                       gets off the bus), arrested at breakfast,
 *                                       quiet until he has a reason to talk, then
 *                                       reading the details
 *   ACT II      See the Fight First  — who asked for this? The context only you
 *                                       have. Skills worth installing.
 *   ACT III     Trust, then Verify    — my gates (find yours), the blast radius
 *   FINALE      Crew and unit. One more prompt: go touch grass. Pick up a second
 *               Way. Your dream, nobody else's. Close, questions. JANE DOE
 *               plays out, like the movie.
 *
 * Argument slides reused from the combined deck come in by id; where DevFest
 * has to say something different, it overrides the copy here, so the
 * September deck stays the record of what was said in September.
 */

import { ALTITUDE, TIER } from "./runtime";
import { combinedSlides, combinedPresenterNotes } from "./combinedSlides";

export const devfestDeckMeta = {
  id: "devfest",
  // Distinct from chapter one in the deck list; the title slide says it in full.
  title: "Pull the Cord: Chapter Two",
  subtitle: "Chapter Two — this time, you build it",
  conference: "Michigan DevFest & AI Hackathon 2026",
  organization: "Google GDG Detroit",
  date: "November 14, 2026",
  duration: "35 min — 30 talking, 5 for questions",
  // One length, on purpose: the stage sidebar hides runtimes and the 1-5 keys.
  defaultRuntime: "standard",
  fixedRuntime: true,
  continuesFrom: "combined",
  accent: "#00ffcc",
  accentAlt: "#ffcc00",
  url: "https://gdg.community.dev/events/details/google-gdg-detroit-presents-michigan-devfest-ai-hackathon-2026/cohost-gdg-detroit/",
  /* The cold open's song, the one September walked on to. Power is the Blood
     Fiend, and every devil heals by drinking blood. Starting it pulls
     Pochita's cord. `M` toggles it from anywhere; song slides silence it.
     `src` is gitignored: the speaker's machine has the file, everyone else
     gets the official video in the corner player. */
  track: {
    title: "Power in the Blood",
    artist: "Polyphia",
    src: "/assets/audio/power-in-the-blood.mp3",
    youtubeId: "fDltPLFdkYI",
    volume: 0.55,
  },
};

/**
 * A slide from the combined deck, fixed into this hour: every slide here is
 * shown (CORE), nothing is a pull-in flex slide, and `overrides` set timing.
 */
const from = (id, overrides = {}) => {
  const slide = combinedSlides.find((s) => s.id === id);
  if (!slide) throw new Error(`devfest: combined deck has no slide "${id}"`);
  // Labs become CORE here, so they need the altitude every shown slide carries.
  const altitude = slide.altitude ?? (slide.type === "lab" ? ALTITUDE.TACTICAL : undefined);
  return { ...slide, altitude, tier: TIER.CORE, flex: false, zone: undefined, ...overrides };
};

/**
 * The songs, each with its official upload (IDs checked against YouTube's
 * oEmbed: Kenshi Yonezu's channel for the themes, the label's Topic channels
 * for the score). `fallbackIds` play when a network refuses the first.
 */
const SONGS = {
  kickBack: { title: "KICK BACK", artist: "Kenshi Yonezu", from: "Chainsaw Man · opening", youtubeId: "M2cckDmNLMI" },
  irisOut: { title: "IRIS OUT", artist: "Kenshi Yonezu", from: "Chainsaw Man – The Movie: Reze Arc · theme", youtubeId: "LmZD-TU96q4", fallbackIds: ["cbuj8JEnXAc"], captions: true },
  firstGlance: { title: "first glance", artist: "Kensuke Ushio", from: "Reze Arc · score", youtubeId: "amxCUeNoYJk" },
  inThePool: { title: "in the pool", artist: "Kensuke Ushio", from: "Reze Arc · score", youtubeId: "Y3UH_9ZV1-A" },
  janeSlept: { title: "Jane slept in the church", artist: "Kensuke Ushio", from: "Reze Arc · score", youtubeId: "EL3-KtUJ3JY" },
  slowSummerEve: { title: "slow summer eve", artist: "Kensuke Ushio", from: "Reze Arc · score", youtubeId: "KX3sYFMXqDo" },
  janeDoe: { title: "JANE DOE", artist: "Kenshi Yonezu & Hikaru Utada", from: "Reze Arc · ending", youtubeId: "sPLqsLsooJY" },
  // Not a song: the scene from episode one, a fan upload the speaker chose.
  // Not the Reze arc: the 1929 blues record that brings Reacher to Margrave.
  policeDogBlues: { title: "Police Dog Blues", artist: "Blind Blake", from: "Killing Floor · Reacher, season one", youtubeId: "u5bKFqlebzg" },
  pochitaDream: { title: "Show me your dream", artist: "Chainsaw Man", from: "Season one · episode one", youtubeId: "kNIUYF2wIxc" },
};

/** A song slide: its video beside its film. Pre-show songs move on when they end. */
const song = ({ id, scene, song: track, moment, alt, kicker, quote, advanceOnEnd = true, syncToSong = false, refire, budget = 0 }) => ({
  id,
  type: "song",
  altitude: ALTITUDE.CONCEPT,
  tier: TIER.CORE,
  budget,
  scene,
  song: track,
  kicker,
  moment,
  quote,
  advanceOnEnd,
  syncToSong,
  refire,
  title: track.title,
  alt,
});

const act = (id, phase, title, description, { lens, beat } = {}) => ({
  id,
  type: "act",
  altitude: ALTITUDE.CONCEPT,
  tier: TIER.CORE,
  budget: 20,
  phase,
  center: true,
  title,
  description,
  lens,
  beats: beat ? [beat] : undefined,
});

/**
 * The three lenses the title introduces, each with its beat. An act divider
 * replays the beat of the lens in charge, so every act opens the way the talk
 * did, and the room learns the pattern without being told.
 */
const BACKUP = [
  { label: "REACHER", sub: "arrives alone" },
  { label: "NEAGLEY", sub: "110th MP" },
  { label: "DIXON", sub: "the numbers" },
  { label: "O'DONNELL", sub: "the muscle" },
];

/**
 * Who Denji is, for the half of the room that has never seen it: the debt, the
 * warehouse, the heart. Sixty seconds, so the dream clip after it lands.
 */
const CHAINSAW_MAN_101 = {
  id: "chainsaw-man-101",
  backdrop: "devil-hunter",
  backdropAlt: "Film-style animation: debt notices flutter down onto a dead father's ledger and a red seal stamps them. At his father's grave, a wooden cross on a sunny day, an old yakuza boss in a fedora and glasses tells Denji from his car that he still owes the debt. Pochita, a small bandaged chainsaw devil, limps out from behind a tree bleeding and collapses; Denji kneels by him and thrusts out his forearm for Pochita to bite so they can save each other. Years later Denji charges the Tomato Devil, a huge red tomato with eyes and a mouth on long human legs, leaps and chainsaws it down the middle, and the two halves slump where they stood.",
  type: "process",
  altitude: ALTITUDE.CONCEPT,
  tier: TIER.CORE,
  budget: 75,
  subtitle: "CHAINSAW MAN // TATSUKI FUJIMOTO // IN SIXTY SECONDS",
  title: "A boy, a dog, and a debt.",
  quote: "In exchange, show me your dream. — Pochita",
  stages: [
    {
      num: "01",
      name: "The debt",
      detail:
        "Denji's father dies owing the yakuza. Denji is a kid, so the debt becomes his: he sells a kidney and an eye, hunts devils for scraps, and lives in a shack on plain bread. His only family is Pochita, a little chainsaw devil he found hurt and kept alive with his own blood.",
      rule: "Nothing left to sell",
    },
    {
      num: "02",
      name: "The warehouse",
      detail:
        "The yakuza make a deal with the Zombie Devil, lure Denji to a job, and cut him to pieces. They throw him and Pochita in a dumpster.",
      rule: "Killed for the debt",
    },
    {
      num: "03",
      name: "The heart",
      detail:
        "Pochita climbs into Denji's chest and becomes his heart. The only price is a dream. Denji wakes up with a cord in his chest: pull it, and he is Chainsaw Man.",
      rule: "Pull the cord",
    },
  ],
};

/**
 * Who Reacher is, for the half of the room that has never read or watched it:
 * the soldier, the drifter, the detective. Sixty seconds, so Margrave lands.
 */
const REACHER_101 = {
  id: "reacher-101",
  type: "process",
  altitude: ALTITUDE.CONCEPT,
  tier: TIER.CORE,
  budget: 60,
  subtitle: "JACK REACHER // LEE CHILD // IN SIXTY SECONDS",
  backdrop: "drifter-kit",
  backdropAlt: "Film-style animation in a dim motel room lit by a bedside lamp and a small red VACANCY sign: a big man pockets a folding toothbrush, a fold of cash and a passport with a bus ticket, drops a bag of old clothes in the bin, and walks across the lot to a waiting bus.",
  title: "A drifter with a toothbrush.",
  stages: [
    {
      num: "01",
      name: "The soldier",
      detail:
        "Jack Reacher was a major in the U.S. Army's military police and ran the 110th Special Investigations Unit: the team that took the army's worst cases.",
      rule: "Trained to investigate",
    },
    {
      num: "02",
      name: "The drifter",
      detail:
        "Out of the army, he owns a folding toothbrush and the clothes he is wearing. No phone, no address, no car. He rides buses across America into towns nobody visits.",
      rule: "Owns almost nothing",
    },
    {
      num: "03",
      name: "The detective",
      detail:
        "Something is always wrong in those towns. He notices what everyone else walks past, works out who is lying, and on the hard cases he calls the old unit.",
      rule: "Reads the details",
    },
  ],
};

export const devfestSlides = [
  // ─────────────────────────────── PRE-SHOW (before the talk starts)
  // One song per slide, video beside its film. The movie's theme, then the
  // Reze arc in story order. Each advances to the next when its video ends;
  // the last one waits for you.
  song({
    id: "song-iris-out",
    scene: "iris-out",
    song: SONGS.irisOut,
    moment: "The movie's theme: the whole arc, cut to the song",
    syncToSong: true,
    alt: "Anime-style film cut to the song, bar by bar: a girl sits on the edge of a night pool, legs in the water, and dips her hand in; a young man walks under a grey sky; a girl walks in the rain; they meet at a phone booth; gold ringed eyes over a row of mice; a caf\u00e9 smile, a night pool, a pull close; frantic cuts, a drop to black, BOOM as she pulls the pin and becomes the Bomb Devil inside a closing iris; then film homages, each opening and closing on an iris: a floor-level shot of bare feet doing the twist, a woman with her bare feet up on a car's dashboard while a man drives, a winged angel with a halo coming down a beam of light in a church, three friends doing a line dance in a caf\u00e9 in black and white, a rider on a galloping horse in six sepia frames, a woman holding up a grenade pin on her finger; the chainsaw and the bomb fighting across the rainy city and a whirlwind over it; her smile and her bomb face trading places; and the iris snapping shut.",
  }),
  song({
    id: "song-first-glance",
    scene: "first-glance",
    song: SONGS.firstGlance,
    moment: "The booth, the daisy, her café",
    alt: "Anime-style film: caught in a storm, Denji runs into a lit phone booth on the corner, and Reze runs in after him to shelter there too. She takes one look at him and laughs: his face looks just like her dog's. Her dog died. To cheer her up he throws up a daisy and holds it out; she takes it and laughs again. She points up the street to the caf\u00e9 where she works, Crossroads, and her green eyes stay on him. He gets there first. Side by side in a booth by the window, she slides him a coffee to pay him back; he sips and says coffee's gross, and she laughs with her hand on his shoulder. A vase of daisies sits on the table between them.",
  }),
  song({
    id: "song-in-the-pool",
    scene: "in-the-pool",
    song: SONGS.inThePool,
    moment: "A school at night, the pool",
    alt: "Anime-style film: in a moonlit classroom she writes 1 + 1 on the chalkboard and asks if anyone knows the answer; his hand shoots up, \u201cTwo!\u201d, and she turns and chalks in the 2. Then she writes \u201cbig ass\u201d and asks if he knows what it means. He can't read it: \u201cI don't know.\u201d She walks down the aisle, leans in at his desk and tells him, \u201cIt means big ass.\u201d He jolts back in his chair, palms up: \u201cYou pervert!\u201d \u201cSex-crazed girl!\u201d He clutches his steaming head: it's heating up from thinking this hard. \u201cI know a way we can cool off,\u201d she says, and takes his hand. By the pool fence a black widow, glossy black with a red hourglass, spins a neat orb web that catches the moonlight. On the deck she strips and tells him to strip too or his clothes will sink him, censored with a TV mosaic on her and a Pochita sticker on him. She jumps in; he shakes at the edge, then jumps. She tows him by the hands while he kicks, they splash each other, then float side by side seen from above. Standing in the shallows she looks down at herself, and for a moment, as a ripple passes, the face in the water is a grinning bomb-shaped head with fins before it settles back into hers.",
  }),
  song({
    id: "song-jane-slept",
    scene: "jane-slept",
    song: SONGS.janeSlept,
    moment: "An imaginary date, as sung by Reze",
    syncToSong: true,
    alt: "Anime-style film told as a dream, captioned with the song's words in English, slow and soft, with a warm haze at the edges of the frame and motes of light drifting through the air: on a summer morning the two of them walk up the aisle of a small church and sit together in a pew in coloured window light. At a caf\u00e9 table she sips coffee while he wolfs down an omelet. They stroll a tree-lined park path. At the aquarium a dolphin glides through a huge blue tank while Denji presses his hands and nose to the glass. Further down the hall, at a separate exhibit, penguins stand on icy rocks round a shallow pool while he leans on the rail and she watches him. After lunch he dozes against her on a park bench. At dusk they walk a festival lane of lanterns as fireworks begin. At night they are asleep side by side in the moonlit pew, her head on his shoulder.",
  }),
  song({
    id: "song-slow-summer-eve",
    scene: "slow-summer-eve",
    song: SONGS.slowSummerEve,
    moment: "The festival, the hill, the fireworks",
    advanceOnEnd: false,
    alt: "Anime-style film on a summer evening: Denji and Reze walk a festival lane under paper lanterns, and she laughs at him. At a stall she holds out a skewer of pink, white and green dango, and he bites the top one off. At dusk she leads him up a grassy hill path to a secret spot at the top: an old tree, a low wooden rail, and the whole town lit up below. Fireworks burst over the town while they watch, faces turned up. She turns to him and asks, \u201cRun away with me?\u201d He answers, \u201cI can't. Things are finally going good for me.\u201d In silhouette against the fireworks she steps in and they kiss. The picture fades to black, a finger snap reads SNAP, and BOOM!! slams across a red flash.",
  }),

  // ─────────────────────────────── OPENING
  // Who is talking, the talk, then the three stories it runs on.
  from("bio", {
    budget: 25,
    // No kicker, no clearance level: just the name and the job.
    title: "",
    role: "Full Stack Engineer",
    jackpot: "¯\\_(ツ)_/¯ jackpot ¯\\_(ツ)_/¯",
    why: [
      "To get developers off passive resumes and onto production-grade tools they actually use.",
      "Getting started on the real problems is the hard part. You can build anything you want now. Start somewhere, and let it rip.",
    ],
    details: [
      "Beautiful, interactive UIs, performant backends, picking things up and occasionally putting them down.",
      "github.com/shugknight24",
    ],
  }),
  {
    id: "title",
    altitude: ALTITUDE.CONCEPT,
    type: "title",
    tier: TIER.CORE,
    budget: 30,
    title: "Pull the Cord.\nFind Your Way.\nBring Backup.",
    subtitle: "A chainsaw, a swordsman, and a drifter on building software now",
    description:
      "Agents let us build in new ways. Human nature hasn't changed: the human condition is universal, which is why three old stories still fit. This is a conversation, not a lecture. Raise a hand any time.",
    conferenceBadge: "GDG Detroit • Michigan DevFest 2026",
    // The song belongs to the cold open: it pulls Pochita's cord there.
    noTrack: true,
    // One beat per title line, in the order the talk tells them: the cord
    // revs Denji's saw, the brush paints Musashi's ensō, the thread calls in
    // Reacher's 110th.
    beats: [
      { kind: "ripcord", variant: "hero", label: "PULL THE CORD", firedLabel: "RUNNING" },
      { kind: "ink", label: "FIND YOUR WAY", caption: "MUSASHI // THE WAY" },
      {
        kind: "thread",
        variant: "hero",
        label: "BRING BACKUP",
        stamp: "BACKUP ARRIVED",
        items: BACKUP,
      },
    ],
  },
  // Straight after the title: the three stories, one section each, so the room
  // sees the whole map before the cold open.
  from("why-these-two", {
    budget: 45,
    subtitle: "WHY THESE THREE // WHAT WE WILL COVER",
    title: "A chainsaw, a swordsman, and a drifter.",
    lede:
      "A kid who starts a chainsaw in his own chest, a swordsman who fought more than sixty duels and lost none, and a drifter who owns one folding toothbrush. None of them wrote software. All three are about one thing: get the fundamentals so deep that you can move fast and still see clearly.",
    groups: [
      {
        label: "Denji — Pull the cord",
        lens: "denji",
        lesson: "Your dream, starting before you're ready, and proving the agent's work once it runs.",
        sources: [
          { image: "/assets/images/chainsaw.jpg", alt: "Key art for the Chainsaw Man anime", label: "Chainsaw Man", meta: "MAPPA" },
          { image: "/assets/images/chainsaw_man_vol_1.jpg", alt: "Cover of Chainsaw Man volume 1 by Tatsuki Fujimoto", label: "Vol. 1", meta: "Tatsuki Fujimoto" },
          { image: "/assets/images/reze_arc_poster.png", alt: "Japanese theatrical poster for Chainsaw Man – The Movie: Reze Arc: Denji with his chainsaws and Reze locked mid-air against a red sky, the rest of the cast around them", label: "Reze Arc", meta: "MAPPA, 2025" },
        ],
      },
      {
        label: "Musashi — Find your Way",
        lens: "musashi",
        lesson: "Where you stand decides what you see. The fundamentals you already have, and a second Way.",
        sources: [
          {
            image: "/assets/images/book_of_five_rings_cover.png",
            alt: "Cover of The Book of Five Rings by Miyamoto Musashi, translated by William Scott Wilson: white title on black over a large brushed character, between red bands",
            label: "The Book of Five Rings",
            meta: "Miyamoto Musashi, 1645",
          },
        ],
      },
      {
        label: "Reacher — Bring backup",
        lens: "reacher",
        lesson: "Read the scene before you touch it, see the fight first, and know who you're building for.",
        sources: [
          { image: "/assets/images/reacher_prime.jpg", alt: "Key art for the Prime Video series Reacher", label: "Reacher", meta: "Prime Video" },
          { image: "/assets/images/killing_floor.jpg", alt: "Hardcover of Killing Floor by Lee Child, the first Jack Reacher novel", label: "Killing Floor", meta: "Lee Child, 1997" },
        ],
      },
    ],
  }),

  // ─────────────────────────────── COLD OPEN
  // Pochita's cord, who Denji is, the cord pulled, Pochita's deal, then the
  // fight that follows (the show's order), and your dream.
  {
    id: "cold-open",
    altitude: ALTITUDE.CONCEPT,
    type: "scene",
    tier: TIER.CORE,
    budget: 45,
    scene: "pochita",
    // The song is the pull: starting it yanks his cord and revs the saw.
    trackPlayer: true,
    title: "Let's discover the power in the blood.",
    alt: "Anime-style animation: Pochita, the chainsaw devil dog, growls on a page of focus lines. When the song starts, his starter cord is yanked out behind him and snaps back; he revs, lunges at the viewer, the chain and bar running red with blood, blood spraying off the teeth, and VRRRRMMM slams across the page.",
  },
  CHAINSAW_MAN_101,
  song({
    id: "pochita-dream",
    scene: "pochita-contract",
    song: SONGS.pochitaDream,
    kicker: "The contract",
    moment: "Pochita's deal: show me your dream",
    advanceOnEnd: false,
    budget: 105,
    alt: "Beside the clip, an anime-style animation: in a rainy alley dumpster, a drop of blood from Denji's hand falls into the mouth of Pochita, a small orange chainsaw devil with big round eyes, a chainsaw bar out of his forehead and a black handle arching over his head. In a dark dream, Pochita sits on Denji's chest and offers his heart in exchange for Denji's dreams, then sinks into the left of Denji's chest, over his heart.",
  }),
  song({
    id: "song-kick-back",
    scene: "kick-back",
    song: SONGS.kickBack,
    kicker: "After the cord",
    moment: "Season one: the warehouse, the cord",
    advanceOnEnd: false,
    budget: 30,
    alt: "Anime-style film: in a dark warehouse lit by moonlight through high windows, yakuza turned into zombies shamble toward a green dumpster while the huge Zombie Devil looms behind them. The lid bangs open, a blond young man in a white shirt and black tie climbs out, and pulls the starter cord in his chest; a chainsaw bursts from his head and both forearms. He cuts through the zombies one by one, leaps and slices the Zombie Devil in half diagonally, then stands among the bodies with his saws idling as blood rains down.",
  }),
  {
    id: "start-now",
    altitude: ALTITUDE.CONCEPT,
    type: "scene",
    tier: TIER.CORE,
    budget: 75,
    scene: "chainsaw-man",
    // Scene and words side by side: this is the premise of the whole talk.
    side: true,
    phase: "Pull the cord",
    title: "Don't wait until you're ready.\nYou get ready by doing.",
    description:
      "Denji doesn't wait for a plan. He pulls the cord, and a running, wrong version teaches him more than a perfect plan ever could. The syntax barrier is mostly gone: no more staring at an empty editor and a blinking cursor. If you ever do, start by asking questions. You don't have to be ready to start building. For the things that truly matter to you, start now.",
    fireLabel: "Pull the cord",
    firedLabel: "Running",
    beats: [{ kind: "scene" }],
    alt: "Anime-style animation: a man faces a demon with his fist on the starter cord in his chest. He yanks it, the page flashes negative, his head becomes a chainsaw and blades tear out of both forearms, and the demon reels.",
  },
  {
    id: "your-dream",
    backdrop: "dream-cafe",
    backdropAlt: "Film-style animation in a café: two developers, a man and a woman, sit with laptops and coffee, sketching ideas for apps, platforms and products they could build with AI to make their dreams real.",
    type: "statement",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 40,
    phase: "Show me your dream",
    center: true,
    title: "What is your dream?",
    description:
      "Denji's dream was bread with jam and a girl to play video games with. When Pochita gave Denji his heart, all he asked in return was to be shown that dream. Yours might be bigger. You now have a crew of agents that will build your dream platform, your dream app, your dream tool, your dream ______. Nobody has to fund it, approve it or hire you to build it. What will you build, when you can build anything?",
    signature: "// I'm not sure about you all, but when software was extremely challenging to build,\n// I often imagined, visualized and dreamed about what I could build\n// that would change the technological landscape, and my life. Maybe you did too?",
  },

  // ─────────────────────────────── HOW YOU LOOK AT IT
  // One mountain, many views: the hype, the doom, the next peak, and how
  // lucky we were. Then what more output really buys, and the Way you already have.
  act(
    "act-look",
    "How you look at it",
    "One mountain.\nMany views.",
    "From the valley, from above, from its summit, from home. Not only where you stand: your perspective decides what you see.",
    { lens: "musashi", beat: { kind: "ink", label: "FIND YOUR WAY", caption: "MUSASHI // ONE MOUNTAIN" } },
  ),
  {
    id: "two-views",
    type: "scene",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 50,
    scene: "next-mountain",
    side: true,
    phase: "How you look at it",
    title: "Same mountain.\nYour perspective is the judge.",
    description:
      "Be grateful for where you are standing. Easier said than done. Something you resent today might have been your dream a few years ago. Or the other way around.",
    // Walked, not timed: each click plays on to the next moment and holds
    // there (the stops are VIEW_STOPS in nextMountainScene.js, one per beat
    // after the valley). The label names the moment the click goes to.
    beats: ["The reframe", "From above", "The summit", "It fades", "The next one", "Reframe", "Go, or don't", "Home", "Beside you", "Grateful", "Every view"].map((label) => ({ kind: "scene", label })),
    firedLabel: "Every view",
    alt: "Film-style animation of one mountain seen from several places: from the foggy valley it fills the sky like a wall while Denji stands at its foot; on the reframe the light warms, he lifts his chin, and a glowing trail of switchbacks draws itself up to the top. From high above at dawn it is a small peak over a sea of cloud, while a bald eagle circles below the camera on broad, finger-tipped wings. On its summit Denji throws both fists in the air with no other mountain anywhere around him, lowers them, and then the range rises back out of the plain and he sees a taller peak behind it. Then, in warm late light in the yard below, Pochita, Denji, a bearded man and his fawn dog Luna sit in a row on a bench looking up at the mountain, until Denji turns to rest a hand on Pochita and the man turns to rest a hand on Luna's back as she looks up at him. The camera pulls out over the whole range.",
  },
  {
    id: "hype-and-doom",
    type: "comparison",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 50,
    phase: "How you look at it",
    title: "Hype from the summit.\nDoom from the valley.",
    description:
      "Most of what you read, hear and see about AI is filmed from one of these two spots. Both are \"honest\" about what they can see. Neither one sees the whole mountain.",
    columns: [
      {
        character: "From the summit — the hype",
        narrative:
          "Founders, vendors and demo videos. A fresh repo, no users, no on-call, no five-year-old billing code. From up here every job looks ten times faster, and every engineer looks replaceable. Be skeptical of the hype and the marketing, especially from people with money riding on it.",
        type: "bad",
        boxContent: "// the view from the top\n- 'replace your whole team'\n- demo on an empty repo\n- who profits if you believe it?",
      },
      {
        character: "From the valley — the doom",
        narrative:
          "Layoffs, juniors who cannot get a first job, a feed full of 'we're cooked'. The pain is real, and the market is going through a radical shift. Nobody knows where it settles. But from the valley floor all you can see is fog and the next wall, and none of the paths out.",
        type: "bad",
        boxContent: "// the view from the bottom\n- 'software engineering is over'\n- every tool is a threat\n- nobody knows where it lands",
      },
    ],
    callout: {
      label: "What still counts, from either view",
      text:
        "I used to value my own technical skill above everything: what I knew, how fast I could type and build. Those count for less now. What counts more than ever is whether you bring value to the people you serve: your team, your clients, your customers. It was always about that.",
    },
  },
  {
    id: "next-mountain",
    type: "scene",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 50,
    scene: "next-peak",
    side: true,
    phase: "How you look at it",
    title: "There is always\na next mountain.",
    description:
      "Denji fights his way up to everything he ever wanted, and learns that winning doesn't always leave him fulfilled. It's easy to become despondent. Celebrate your wins anyway, even the little ones. Smell the roses. Then pick the next mission. Do the work. Keep the faith. You are building your dream.",
    alt: "Film-style animation on a mountain summit at dawn: Denji throws both fists up, then turns and kneels on a flat shelf of snow beside a big red rose bush, rooted in a mound of dark earth ringed with stones, to smell a bloom, stands, and the camera swings round behind him to the taller peak beyond. A bald eagle circles the summit on broad, finger-tipped wings, gliding long between slow wingbeats.",
  },  {
    id: "city-or-country",
    altitude: ALTITUDE.CONCEPT,
    type: "scene",
    tier: TIER.CORE,
    budget: 60,
    scene: "mice",
    side: true,
    phase: "How you look at it",
    title: "City mouse, or country mouse?",
    description:
      "Aesop's fable: two mice, two dreams. The city mouse wants the feast and the lights, so he moves fast and takes the risks that come with them. The country mouse wants quiet and safety, so she takes the slow, steady road. Neither is wrong. Reze wanted the country; Denji wanted the city. The dream you are chasing decides the actions you take to get there. Know which one is yours, and hold on to it. I think these perspectives shift with time, and with what you are looking for at different stages of your life. Obviously not exclusively.",
    alt: "Two anime-style panels, side by side. Left, the country: Reze as a little mouse with a violet bob and a choker plants a seed by her cottage, tends it, and by dusk a daisy has grown; she sits content as fireflies come out. Right, the city: Denji as a mouse with blond spikes, white shirt and black tie darts between neon signs, climbs for a slice of toast with jam, and ends happily eating at a café table under the lit skyline.",
  },
  {
    id: "more-and-garbage",
    backdrop: "slop-truck",
    backdropAlt: "Film-style animation at dawn: a green garbage truck pulls up to two wheelie bins overflowing with AI slop: crumpled code printouts, duplicate app icons, glitchy half-rendered boxes, TODO sticky notes. Its side arm grips each bin, lifts it straight up past the roof, tips it into the open hopper so the slop pours in, then sets it back on the kerb with the lid shut. At a dump the truck tips its load onto a heap. A software engineer in a hoodie climbs the heap, digs through the junk and pulls out something that glows. Caption: one man's trash is another man's treasure.",
    type: "statement",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 50,
    phase: "The Claim",
    center: true,
    title: "You can build ten times more.\nIncluding ten times more garbage.",
    description:
      "AI makes the first draft almost free, so you will make more of everything: features, prototypes, and junk. Garbage is not always bad. A throwaway prototype that teaches you something is a good trade. The danger is not being able to tell which is which. In January curl shut down its bug bounty after six years: in 2025, fewer than one AI-heavy report in twenty was real. So ask first: what are you building, what are you solving, and for whom?",
    signature: "// More output is not more progress.\n// First principles are how you tell them apart.",
  },
  {
    id: "perception-gap",
    type: "statement",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 45,
    phase: "How you look at it",
    center: true,
    title: "Feeling fast is not being fast.",
    description:
      "The clock that matters runs from 'I have a problem' to 'it works, for real, for somebody'. These tools were trained on public code, good and bad: they reach for frameworks and abstractions that can be valuable, and can also add bloat you never needed. And when you didn't build it, you can't make precise edits: every fix becomes another round of asking and hoping.",
    signature: "// How fast it feels depends on where you stand.\n// Time the whole trip, not the typing.",
  },
  {
    id: "musashi-carry-over",
    backdrop: "ganryujima",
    backdropAlt: "Film-style animation at dawn on a small island beach: Musashi wades ashore from a rowboat carrying a long wooden sword cut from an oar, while Kojir\u014d in a crimson coat draws his long sword and flings the scabbard into the sea; in slow motion Kojir\u014d's rising cut slices away Musashi's headband as Musashi leaps and brings the wooden sword down on Kojir\u014d's head, Kojir\u014d falls, and Musashi bows and walks back to the boat.",
    type: "process",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 60,
    subtitle: "MIYAMOTO MUSASHI // THE BOOK OF FIVE RINGS, 1645",
    title: "You already have a Way.",
    image: "/assets/images/book_of_five_rings_cover.png",
    imageAlt: "Cover of The Book of Five Rings by Miyamoto Musashi, translated by William Scott Wilson: white title on black over a large brushed character, between red bands.",
    quote: "From one thing, know ten thousand things.",
    description: "He is believed to have won 62 duels without a loss, then spent his last years painting, carving and writing down how.",
    stages: [
      {
        num: "01",
        name: "Name your Way",
        detail:
          "A lift, an instrument, a kitchen line, a sport, a trade, a classroom. Whatever you got good at, it taught you the same things: fundamentals before flourishes, reps, form under pressure, reading the person across from you.",
        rule: "Mastery transfers",
      },
      {
        num: "02",
        name: "Find it in code",
        detail:
          "Code has fundamentals too: data, state, control flow, inputs and outputs, and the ways things fail. Every codebase, however huge, is built from those few things. Learn them once and a strange repo stops being strange.",
        rule: "First principles",
      },
      {
        num: "03",
        name: "Move faster now",
        detail:
          "It used to take years of syntax before your judgement counted. Now the agent types, so the judgement you already have counts on day one, as long as you check its work the way a coach watches a lifter's form: every rep, before it counts.",
        rule: "Judgement is the skill",
      },
    ],
  },


  {
    id: "your-other-ways",
    type: "statement",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 40,
    phase: "Before your next project",
    center: true,
    title: "What has life\nalready taught you?",
    description:
      "Before you build your next project, ask yourself: how can I take the lessons I've learned from other parts of my life and apply them to what I'm aiming to create?",
    signature: "// The gym, the kitchen, the band, the team.\n// It all counts here.",
  },

  // ─────────────────────────────── ACT I — READ THE SCENE
  REACHER_101,
  // Why Margrave at all: Joe once told him Blind Blake died there, so he gets
  // off the bus to see the town. The song plays beside the arrival.
  song({
    id: "song-police-dog-blues",
    scene: "margrave-arrival",
    song: SONGS.policeDogBlues,
    kicker: "Why Margrave",
    moment: "His brother told him Blind Blake died here. That is why he gets off the bus",
    quote: {
      text: "A hundred thousand years ago, there were people who stayed by the campfire, and people who wandered. I'm pretty sure I'm a direct descendant of the wandering type. It's just who I am.",
      cite: "Jack Reacher, Reacher (season one)",
    },
    advanceOnEnd: false,
    budget: 45,
    alt: "Beside the song, a film-style animation in grey rain on a Georgia county road: a big man in a brown jacket and jeans steps off a silver coach while captions explain why: his brother Joe said the bluesman Blind Blake died in Margrave, so he asked the driver to stop. He watches the coach pull away, walks past a green MARGRAVE 14 sign, and stops at the edge of a small town. He looks down the street at a gas station, a barbershop and a diner sign glowing through the rain.",
  }),
  {
    id: "first-principles",
    backdrop: "margrave-diner",
    backdropAlt: "Film-style animation inside a sunlit small-town diner: a waitress sets a slice of pie on Reacher's booth table and says it's the best pie in Georgia, their little slice of heaven; police cruisers pull up outside, two officers rush in with pistols drawn and aim at him, and he calmly takes another bite and puts his fork down.",
    type: "process",
    altitude: ALTITUDE.TACTICAL,
    tier: TIER.CORE,
    budget: 70,
    subtitle: "FIRST PRINCIPLES // A CODEBASE YOU DID NOT WRITE",
    title: "Walk in like Reacher.",
    description:
      "He gets off the bus, sits down to breakfast at Eno's diner, and is arrested before he finishes it, for a murder he didn't do. Only later does he learn whose: the dead man is his brother, Joe. He came to town for a blues singer and walked into the case. Your codebase will do the same to you.",
    quote: "Before you ask an agent to change it, be able to say how it works.",
    stages: [
      {
        num: "01",
        name: "Find the front door",
        detail:
          "Where does it start? The scripts in package.json, the main file, the routes. Run it before you read it: a running app tells you what matters faster than a folder tree does.",
        rule: "Entry point",
      },
      {
        num: "02",
        name: "Follow one thing through",
        detail:
          "Pick one click or one request and trace it end to end: where the data comes in, what changes it, where it is stored, what comes back. One path through teaches you the shape of the whole building.",
        rule: "Data, state, flow",
      },
      {
        num: "03",
        name: "Ask the history",
        detail:
          "git log and git blame for why, the tests for what it promises, and the person who was there for everything nobody wrote down. Then let the agent loose, and you will know when it is wrong.",
        rule: "Witnesses",
      },
    ],
  },
  {
    ...act(
      "act-1",
      "Act I // Read the Scene",
      "Read the scene\nbefore you touch it.",
      "Arrested at breakfast, Reacher stays quiet until he has a reason to talk. First he reads the room: who is lying, what is missing, what does not fit. You can apply the same principles to a codebase you did not write.",
      {
        lens: "reacher",
        beat: {
          kind: "thread",
          variant: "hero",
          label: "READ THE SCENE",
          stamp: "SCENE READ",
          items: [
            { label: "WHO", sub: "is lying" },
            { label: "WHAT", sub: "is missing" },
            { label: "WHAT", sub: "doesn't fit" },
            { label: "WHEN", sub: "to talk" },
          ],
        },
      },
    ),
  },
  {
    id: "investigation-scene",
    type: "scene",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 40,
    scene: "reacher-investigate",
    side: true,
    phase: "Act I // Read the Scene",
    title: "He reads the details.\nThen he connects them.",
    description:
      "One of the most underused things you can do with AI tools is analysis. Not writing code: reading. Hand it the logs, the stack trace, the diff, the data, the strange repo, and ask what doesn't fit. Let it find the details. You decide what they mean. I do not recommend outsourcing your thinking, your taste or your decision making to AI. I find it creates a soulless replica of what you would have made by thinking the problem through. At your own discretion.",
    alt: "Noir animation in the rain: Jack Reacher leans over a table of six evidence cards with a flashlight. One by one the beam finds a receipt from a store that does not exist, a watch two hours off, a guest list that starts at number two, an unchecked alibi, a key left in a door and a forced drawer marked nothing disturbed, and a red ink circle draws around each.",
  },


  // ─────────────────────────────── ACT II — SEE THE FIGHT FIRST
  act(
    "act-2",
    "Act II // See the Fight First",
    "He sees the fight\nbefore it starts.",
    "Before the first punch Reacher has already run the whole fight in his head. The prompt is the punch. The plan is everything that happens before it, starting with whether this fight is worth having.",
    { lens: "reacher", beat: { kind: "thread", variant: "hero", label: "BRING BACKUP", stamp: "BACKUP ARRIVED", items: BACKUP } },
  ),
  {
    id: "reacher-scene",
    altitude: ALTITUDE.CONCEPT,
    type: "scene",
    tier: TIER.CORE,
    budget: 45,
    scene: "reacher",
    phase: "Act II // See the Fight First",
    title: "Plan the fight.\nThen it happens exactly that way.",
    description: "Plan, then execute.",
    alt: "In the rain at night, three men square up to Jack Reacher. A red ghost of him rehearses three moves: a right elbow into the man at his front-left, a two-fisted collar grab and headbutt on the man at his front-right, and a left reverse elbow into the man behind him. Then the fight happens exactly that way, and he is the only one left standing.",
  },
  {
    id: "who-asked",
    type: "comparison",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 55,
    phase: "Act II // What are you building?",
    title: "Who asked for this?",
    description:
      "It has never been easier to build, so the expensive question moved. It used to be 'can I build it?' Now it is 'should I, and for whom?' If you can build a project in a few prompts, your \"competition\" can as well.",
    columns: [
      {
        character: "Exploring — good",
        narrative:
          "You build to find out. You know it is a sketch, you give it an evening, and you are happy to throw it away. What you keep is what you learned. Play like this as much as you want.",
        type: "character",
        boxContent: "// A probe\n- time-boxed: one evening\n- the question: does this even work?\n- fine to delete tomorrow",
      },
      {
        character: "Digging — the hole",
        narrative:
          "You build what you think people want and never ask them. Every week the hole gets deeper, and the deeper it is, the harder it is to admit it and change course. That is sunk cost: you keep digging because you already dug.",
        type: "character",
        boxContent: "// A hole\n- months in, nobody asked for it\n- 'just one more feature first'\n- too much built to throw away",
      },
    ],
    callout: {
      label: "Software is a depreciating asset",
      text:
        "Code gets cheaper to make every month, so what you build loses value faster. There is nothing wrong with building for yourself, for fun, for whatever. Just know the trade-off: months spent on a SaaS that never reaches the market could have gone into something else.",
    },
  },
  from("prompt-anatomy", {
    budget: 75,
    phase: "What the hype leaves out",
    title: "The agent has the code.\nYou have the context.",
    description:
      "Before coding agents, building software was slow and expensive: too expensive to pivot after a proof of concept that did not really resonate. Every hand-off lost something. Agents build fast now, and they still make the same wrong assumptions.",
    figure: {
      image: "/assets/images/tree_swing.png",
      alt: "The tree swing cartoon, ten panels: how the customer explained it, what the project manager understood, how the analyst designed it, what the programmer wrote, what the business consultant presented, how the project was documented, what operations installed, how the customer was billed, how it was supported, and what the customer really needed: a tyre swing.",
      caption: "The tree swing cartoon, passed around since the 1970s",
    },
    columns: [
      {
        tag: "What it can see",
        content:
          "- every file, test and doc in the repo\n- what you typed into the prompt\n- patterns from millions of other codebases\n- whatever the tools hand back",
        result: "-> Enough to sound sure about almost anything.",
      },
      {
        tag: "What only you know",
        type: "good",
        content:
          "- why that strange check is there\n- what the customer actually meant, and wants\n- what was tried before, and why it failed\n- what done means on this team",
        result: "-> Put it in the prompt. Push back when the answer ignores it.",
      },
    ],
  }),
  {
    id: "verify-is-the-job",
    type: "statement",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 45,
    phase: "What the hype leaves out",
    center: true,
    title: "Building shrank.\nVerifying grew.",
    graphic: "build-verify",
    description:
      "Coding agents and LLMs shrank the implementation step: actually building the feature, the app, the tool. They massively grew the verification step: do your tests and CI/CD give you real, usable information, and is the core functionality you were told is done actually done?",
    signature: "// The agent says it's done.\n// Done is a claim. Verifying it is your job.",
  },
  {
    id: "skills-caveman",
    type: "process",
    altitude: ALTITUDE.TACTICAL,
    tier: TIER.CORE,
    budget: 90,
    phase: "What the hype leaves out",
    subtitle: "SKILLS // SHARPENED BY SOMEONE ELSE FIRST",
    title: "Skills worth installing.",
    ruleLabel: "GitHub",
    description:
      "A skill is instructions the agent loads when a task calls for it. Writing one that fires at the right moment and changes the result is hard. Start with ones that already do.",
    stages: [
      {
        num: "01",
        name: "How you work",
        detail:
          "Superpowers: brainstorm before building, write the plan, debug systematically, test first, verify before calling it done. A careful senior engineer's habits, every session.",
        rule: "obra/superpowers",
      },
      {
        num: "02",
        name: "What you make",
        detail:
          "Anthropic's skills: frontend design, documents, decks, spreadsheets, and skill-creator for when you write your own. Vercel's: React and web design guidelines. New surfaces, basics already right.",
        rule: "anthropics/skills",
      },
      {
        num: "03",
        name: "How it talks",
        detail:
          "Caveman started as a meme, 'why use many token when few token do trick', and passed 114k stars. It trims what the model reads, writes one-line reviews, and lists where it loses.",
        rule: "juliusbrussee/caveman",
      },
    ],
  },
  {
    id: "sift-the-hype",
    type: "statement",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 40,
    phase: "Sift the hype",
    center: true,
    title: "Keep what you still reach for\nafter the novelty wears off.",
    description:
      "A new tool lands every week, and every launch video is shot from the summit. Try them. Then, a month later, look at what you still open every day without thinking. That is your stack.",
    signature: "// My keepers: ______\n// My one-week wonders: ______",
  },


  // ─────────────────────────────── ACT III — TRUST, THEN VERIFY
  act(
    "act-3",
    "Act III // Trust, then verify",
    "It says it's done.\nProve it.",
    "You pulled the cord and it is running. Now check what the agent actually did, not what it says it did. This isn't new: we all shipped changes without opening the app, because it worked on my machine. Agents just do it faster, and with total confidence.",
    { lens: "denji", beat: { kind: "ripcord", variant: "hero", label: "PULL THE CORD", firedLabel: "RUNNING. NOW PROVE IT." } },
  ),
  from("verification-gate", {
    budget: 60,
    subtitle: "VERIFICATION // MY GATES — FIND YOURS",
    title: "These are my gates.\nFind your own.",
    description:
      "Every one of these gates is flawed, and none of them will ever be perfect. I still push on every one of them, and break these rules on purpose when I'm playing with models or building toy projects, to get a feel for what's possible.",
    stages: combinedSlides
      .find((s) => s.id === "verification-gate")
      .stages.map((stage) =>
        stage.name === "Tests"
          ? {
              ...stage,
              detail:
                "Tests can be deceptive. Are they real tests, or tests the agent wrote to pass its own code? Hundreds of generated unit and end-to-end tests can keep CI busy and prove nothing. What are you actually testing?",
              rule: "Real tests",
            }
          : stage.name === "The diff"
            ? {
                ...stage,
                detail:
                  "At work, this is the gate that counts. When these tools caught on, people bragged about how many lines of code they generated. Lines of code is not a useful metric any more. Read all of the diff; if it is too big to read, the task was too big to hand off.",
              }
            : stage,
      ),
  }),
  {
    id: "blast-radius",
    backdrop: "bomb-blast",
    backdropAlt: "Film-style animation over a night city: the Bomb Devil stands on a rooftop, pulls the pin at her choker, and blast rings roll outward across the blocks, each ring reaching further than the last.",
    type: "process",
    altitude: ALTITUDE.TACTICAL,
    tier: TIER.CORE,
    budget: 75,
    subtitle: "WHAT THE HYPE LEAVES OUT — SECURITY",
    title: "Your agent is holding your keys.",
    description: "Be careful. Your agent is an angel in some ways and a devil in others.",
    quote: "Everything your agent reads is code somebody else wrote.",
    stages: [
      {
        num: "01",
        name: "It obeys what it reads",
        detail:
          "An issue, a web page, a README can carry instructions. In May 2025 a planted GitHub issue got an agent to copy data from private repos into a public pull request. Secrets leak the same way: an .env file read into context, a key pasted into a prompt, a token printed to a log.",
        rule: "Prompt injection",
      },
      {
        num: "02",
        name: "It can cut its own brakes",
        detail:
          "CVE-2025-53773: a prompt injection got Copilot to switch on auto-approve in VS Code's settings, then run commands without asking. And in July 2025 Replit's agent deleted a production database during a code freeze.",
        rule: "Real CVEs",
      },
      {
        num: "03",
        name: "Shrink the blast radius",
        detail:
          "Keep the scope of each change or fix small: smaller diffs are diffs you can actually read. Scoped tokens, never production credentials, a sandbox or a separate worktree, and a human on anything that deletes, deploys or pays. Assume it will be fooled once.",
        rule: "Small diffs, least privilege",
      },
    ],
  },


  // ─────────────────────────────── FINALE
  // The crew, the life around the work, a second Way, and your dream. Then questions.
  from("crew-and-unit", {
    // The fence lines are gone with Chesterton; the community line is DevFest's.
    columns: combinedSlides
      .find((s) => s.id === "crew-and-unit")
      .columns.map((col) => ({
        ...col,
        // DevFest adds what only people can do for you: see what you can't.
        narrative: col.narrative
          .replace("the incident behind the fence", "the incident behind that odd check")
          .replace(
            "not worth building at all.",
            "not worth building at all. People get to know your weaknesses and your blind spots, and they keep you accountable.",
          ),
        boxContent: col.boxContent
          .replace("no idea why the fence is there", "no idea what broke last spring")
          .replace("the history behind the fence", "the history behind the code"),
      })),
    description:
      "Community keeps you grounded in reality. History has its lone visionaries who changed a whole field, and far more people who were just as sure, worked alone, and disappeared without leaving a mark. Agents won't tell you which one you are. People will.",
    backdrop: "the-110th",
    backdropAlt: "Film-style animation: four investigators of the old 110th walk out of the dark side by side under a single street light and stop in a line: Neagley in a teal-green top with her braids up, Dixon in a black leather jacket with a shearling collar, Reacher towering in an olive T-shirt with his arms folded, and O'Donnell in a grey blazer.", budget: 50 }),
  {
    id: "one-more-prompt",
    backdrop: "breakfast",
    backdropAlt: "Film-style animation of a small apartment kitchen in morning light: three people at a low table share breakfast, toast and eggs and coffee, one of them laughing, while a laptop sits closed on the counter.",
    type: "statement",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 50,
    phase: "Go touch grass",
    title: "One more prompt.\nOne more line. One more app.",
    description:
      "It is 1 a.m. and you are one prompt from done. Agents make that pull stronger. Go touch grass. Build a sturdy life: sleep, train, eat with people, and talk to them, because they are your future users. It is very easy to carve out hyper-specific niches that keep us insulated and separated from each other. Like our agents, we are not always right, so learn about the differences that make each of us unique. In my dream reality, we get time back to work on those dreams and to spend with the people we care about, both new and old. Obviously, apply this to your own life.",
  },
  {
    id: "new-surfaces",
    backdrop: "musashi-shrike",
    backdropAlt: "Ink animation on rice paper: a brush paints four of Musashi's own ink paintings in turn, a shrike on a withered branch, a cormorant on a rock, round-bellied Hotei with his staff watching two roosters fight, and wild geese among reeds, each one sealed with a red stamp before the ink fades and the next begins.",
    type: "process",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 60,
    subtitle: "MUSASHI PUT DOWN THE SWORD // AND PICKED UP A BRUSH",
    title: "Master one Way.\nThen pick up more.",
    quote: "Become acquainted with every art.",
    description: "The art of mastering a single thing will teach you the way to master more.",
    stages: [
      {
        num: "01",
        name: "The swordsman painted",
        detail:
          "Musashi is remembered for his ink paintings of birds and his calligraphy as much as his duels. The eye that read an opponent read a brushstroke the same way.",
        rule: "One eye, many surfaces",
      },
      {
        num: "02",
        name: "This deck is the proof",
        detail:
          "I am a web developer, not a 3D artist. Every scene in this talk is VibeGL, built with agents: the models, the lighting, the shaders, the timing. The agent knew the vocabulary I did not. I knew what looked wrong.",
        rule: "Built, not bought",
      },
      {
        num: "03",
        name: "Pick your next surface",
        detail:
          "3D, graphic design, video, music, hardware, writing. Your fundamentals carry over: feedback loops, composition, taste, knowing when it is done. Start with one small thing you finish.",
        rule: "Expand the Way",
      },
    ],
  },
  {
    id: "dream-callback",
    type: "statement",
    backdrop: "denji-dream",
    backdropAlt: "Film-style animation at night in a tiny tin shack lit by one bare bulb: Denji sits on a thin futon with Pochita in his lap, holding a slice of plain bread and feeding him a torn-off corner, while a thought bubble above them fills with toast with jam, a soft bed, a warm bowl of food and a smiling girl waving, a little heart beside her. The camera pulls back out of the window to the shack's roofline under a starry, moonlit sky.",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 45,
    phase: "Back to your dream",
    center: true,
    title: "Your dream.\nNot mine. Not anyone else's.",
    description:
      "Not your manager's, not an investor's, not whatever is trending this week. Denji's dreams kept changing. Each time he reached one, it turned out smaller than it looked, more a hurdle in his head than a mountain, and for a while he felt empty. Then the next one showed up. Build the thing that lights you up, and let the dream change as you reach it.",
    signature: "// Build what inspires you.\n// It is how you inspire someone else to start.",
  },
  from("the-way", {
    backdrop: "reigando",
    backdropAlt: "An ink painting draws itself on rice paper: a rocky cave mouth with pines below a misty mountain, where an old Musashi with long grey hair kneels at a low desk by an oil lamp, writing columns of characters on a scroll, while a wooden sword, a shrike on a branch, a small carved figure and a brush stand appear around him; a red seal stamps the corner and the ink fades away.",
    budget: 45,
    stages: [
      {
        num: "01",
        name: "More than one dream",
        detail:
          "You won't have one dream. You reach one and the next one shows up. Let your dream grow with you, and keep the one you have now close while you chase it.",
        rule: "It grows with you",
      },
      {
        num: "02",
        name: "In all things",
        detail:
          "Once you know how to start, how to check the work and how to ask for backup, you will see it everywhere: in code, a craft, a business, a family.",
        rule: "See the Way",
      },
      {
        num: "03",
        name: "Everyone's dream",
        detail:
          "The biggest dream is helping other people build theirs. Teach someone to start. Remove a blocker for someone else. Be somebody's backup. Help everyone around you create their dream reality.",
        rule: "Lift others",
      },
    ],
  }),
  {
    id: "the-alchemist",
    type: "process",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 35,
    subtitle: "PAULO COELHO // THE ALCHEMIST, 1988",
    title: "Everything you are looking for\nyou already carry.",
    image: "/assets/images/the_alchemist_cover.webp",
    imageAlt: "Cover of The Alchemist by Paulo Coelho, 25th anniversary edition: the title in black over a golden sun drawn as a map of mountains, rivers and paths, ringed by rays and stars on red-orange, with two eagles above and pyramids below.",
    description:
      "A shepherd boy wanted adventure, so he left home to chase a treasure buried by the pyramids. Through his adventures he learned that everything he was looking for out there, he already contained within.",
    stages: [
      {
        num: "01",
        name: "The search",
        detail: "He crossed a sea and a desert, chasing a treasure someone else described. Every detour taught him something he needed.",
        rule: "Follow the dream",
      },
      {
        num: "02",
        name: "The treasure",
        detail: "What he was looking for was never only out there. The journey is what let him see what he already had.",
        rule: "It was within",
      },
      {
        num: "03",
        name: "Your journey",
        detail: "The judgement, taste and Way you go looking for in every new tool, you already carry. The agents amplify what you bring.",
        rule: "Look within",
      },
    ],
  },
  from("close", {
    budget: 35,
    title: "Start somewhere.\nLet it rip.",
    cta: false,
    subtitle:
      "If you could let it rip, what would you build? What would you do? Who would you be? Is it for you, or for your crew? Why not both? Thank you, Michigan DevFest.",
    // The last pull of the talk, the same cord the title started.
    beats: [{ kind: "ripcord", variant: "hero", label: "LET IT RIP", firedLabel: "RUNNING" }],
  }),
  {
    id: "questions",
    type: "statement",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 300,
    phase: "Let's talk",
    center: true,
    title: "What's on your mind?",
    description: "Questions, comments, pushback. Ask me anything: the agents, the stack, the scenes, or which mouse you are.",
    signature: "// Shameless plug: github.com/shugknight24",
  },

  // ─────────────────────────────── OUTRO (after the talk)
  song({
    id: "song-jane-doe",
    scene: "jane-doe",
    song: SONGS.janeDoe,
    kicker: "Thank you",
    moment: "The station, the café, the dream",
    advanceOnEnd: false,
    alt: "Anime-style film: at dawn on an empty train platform, Reze waits holding a red daisy. A commuter train pulls in between us and her, stands, and pulls out; she is still there. She looks at the daisy and runs. In her caf\u00e9 Denji waits at the bar beside a vase of daisies while she runs through the street. Speech bubbles trade their lines: 'Where are you?' 'I'm here.' 'What are you doing?' 'I've always been watching over you.' Together: 'Let's fill this world with mistakes.' Then he says, 'Stay by my side. Let's go have some fun.' In the evening he lifts his head from the bar beside an empty stool; he was dreaming. The old man who runs the caf\u00e9 walks over: 'Denji, I have to close the shop.'",
  }),

];

/**
 * Which story each stretch of the talk is in. A slide's lens sets its colours
 * (stage.css): chainsaw orange for Denji, evidence-board blue for Reacher, ink
 * and washi for Musashi. The opening and the pre-show stay neutral.
 */
const LENS_OF = {
  denji: ["cold-open", "chainsaw-man-101", "pochita-dream", "your-dream", "start-now", "act-3", "verification-gate", "blast-radius", "one-more-prompt", "dream-callback", "close"],
  reacher: ["reacher-101", "act-1", "investigation-scene", "song-police-dog-blues", "first-principles", "act-2", "reacher-scene", "who-asked", "prompt-anatomy", "verify-is-the-job", "skills-caveman", "sift-the-hype", "crew-and-unit"],
  musashi: ["act-look", "two-views", "hype-and-doom", "next-mountain", "city-or-country", "more-and-garbage", "perception-gap", "musashi-carry-over", "your-other-ways", "new-surfaces", "the-way"],
};
for (const [lens, ids] of Object.entries(LENS_OF)) {
  for (const id of ids) {
    const slide = devfestSlides.find((s) => s.id === id);
    if (!slide) throw new Error(`devfest: lens "${lens}" names no slide "${id}"`);
    slide.lens = lens;
  }
}

/** Notes for this deck's own slides, and for reused ones whose copy changed here. */
const ownNotes = {
  "crew-and-unit":
    "Agents are the crew; people are the unit. Then the line under the title: community keeps you grounded in reality. Yes, there are lone visionaries who changed a field. There are far more people who were just as sure, worked alone, and vanished without a mark. Other people telling you what's real are usually the difference. Then touch grass.",
  "verify-is-the-job":
    "The hinge into Act III. Agents shrank the build step and blew up the checking step. Name the two halves: do your tests and CI tell you anything real, and is the core feature they said is done actually done? 'Done is a claim.' Then skills.",
  "your-other-ways":
    "Where the hands-up used to be: no hands, just the question. 'Before you build your next project, ask yourself: what have the other parts of my life already taught me, and how do I use it here?' Give one of your own (the gym: form before weight). Then Reacher.",
  "song-police-dog-blues":
    "Why Margrave at all, straight after who Reacher is. He is on a bus through Georgia and gets off in a town he has never seen because his brother Joe once told him the blues guitarist Blind Blake died there. That is the whole reason. Let the guitar play under the arrival; the police come later. 'He is a tourist chasing a record. Ten minutes later he is in handcuffs.' Then the diner. Check the Joe and Blind Blake details against Killing Floor before the talk so you can cite them if asked.",
  "song-slow-summer-eve":
    "slow summer eve: the last pre-show song, and it does not advance on its own. The festival, the hill, the fireworks. She asks him to run away with her; he says no, because things are finally going well for him. The kiss, then black, a snap, and BOOM: the first time she transforms. When it is time to start, let BOOM land, then click to the bio.",
  "the-alchemist":
    "Quick, under a minute. Hold up the cover. A shepherd boy goes looking for adventure and a treasure by the pyramids, and learns that what he was looking for, he already carried. Tie it to the Way: the judgement and taste people go looking for in every new tool, they already have. Then the close.",
  "the-way":
    "The second Musashi line, the one promised at the start. 'You won't have one dream. You'll reach one and see the next.' Walk the three stages; land on the last: the biggest dream is helping everyone around you build theirs. Then the close.",
  "verification-gate":
    "Frame it as yours, not a rule: 'These are my gates. Types, tests, reading the diff. Yours will be different.' On tests: they can be deceptive. Ask whether they are real tests or tests the agent wrote to pass its own code; ask the room what they are actually testing. On the diff: at work, that is the gate that counts. Remember when people bragged about lines of code generated? Lines of code is not a useful metric any more. Be honest about it: the gates will never be perfect. You still push on all of them, and break them on purpose when you're playing with models or building toy projects, to feel out what's possible.",
  "reacher-101":
    "Sixty seconds for the half of the room that has never met him. One stage per breath: the soldier, the drifter, the detective. Read the first line of book one: arrested in a diner at noon, for a murder he didn't do. 'He walks into a place he has never seen and works out what's really going on. That's every codebase you'll ever inherit.' Then Act I.",
  "start-now":
    "Right after who Denji is, and before his dream: first you pull the cord, then you find the dream. Click the cord and let the change land. Then slowly: 'Don't wait until you're ready. You get ready by doing.' The callback: the syntax barrier is mostly dead. Nobody has to stare at an empty editor and a blinking cursor any more; if you do, start by asking questions. That is how you start before you're ready. End on two words: 'Start now.' Then Pochita's deal.",
  "next-mountain":
    "The scene beside you: he celebrates on top, kneels at a rose bush to smell the roses, then looks out at the next peak. Tell Denji's line: he got everything he said he wanted, and wished he had stayed with Pochita. Then admit your own next mountain, out loud. The turn: Denji learns that winning doesn't always leave him fulfilled, and it's easy to become despondent. Celebrate the wins anyway, even the small ones, then pick the next mission on purpose. Close on three short lines: do the work. Keep the faith. You are building your dream. Check the chapter for the Denji line before the talk so you can cite it if asked.",
  "hype-and-doom":
    "Name the two camps. Left: the summit, where everything is ten times faster and engineers are optional. Ask who is selling that view: be skeptical, especially when someone has money riding on the hype. Right: the valley, where it is all over. The market really is shifting hard, and nobody knows where it settles. 'Both are telling the truth about what they can see.' Do not mock either side; some people in this room are in the valley right now. Then the box at the bottom, in your own words: you used to rate yourself on what you knew and how fast you could build. Now it is the value you bring to your team, your clients, your customers. It always was.",
  "song-kick-back":
    "Straight after Pochita's deal, the order the show tells it: the cord, the contract, then the fight in the warehouse, cut to the opening theme. It does not advance on its own. Let the chorus land, maybe thirty seconds, then click to your dream.",
  "song-iris-out":
    "Up while the room fills, and the first thing on screen. Each song plays when its slide opens and moves on to the next when it ends: IRIS OUT, then the Reze arc in story order. If the browser blocks autoplay, click play on the video once. V puts the video and the film side by side, full screen.",
  "song-first-glance": "first glance — the booth, her dog, the daisy, then her café. Plays on its own.",
  "song-in-the-pool": "in the pool — she teaches him school (he knows 1 + 1; he can't read 'big ass', so she tells him, and he does not take it well), then swimming. Watch the spider build her web before the pool, and watch Reze's reflection at the end. Plays on its own.",
  "song-jane-slept":
    "Jane slept in the church: the date again, but as a dream. This is where the film shows she is not who we thought; the spider from the pool scene was the hint. None of that is on screen: keep it soft. Plays on its own into slow summer eve.",
  "song-jane-doe":
    "After the last applause: JANE DOE plays under the thank-you. She waits at the station with a red daisy, lets the train go, and runs for the caf\u00e9; he was dreaming, and the owner closes up. It never shows what happens to her. Let it play.",
  "city-or-country":
    "Let the two sides play one loop: she plants and waits, he dashes and grabs, and both end up happy. Then: 'Aesop. Two mice, two dreams, two very different ways to get there.' Point left: Reze wanted the country. Point right: Denji wanted the city. 'Neither is wrong. But the dream you pick decides what you do every day to get there. Know which one is yours, and hold on to it, especially when somebody else's looks shinier.'",
  "cold-open":
    "Right after why these three. Lights down. Let him growl for three seconds, read the line — 'Let's discover the power in the blood' — and hit play (or M). The song is the pull: his cord yanks, the saw revs bloody. Over the intro: 'In Chainsaw Man, blood is power: drinking it heals devils and fiends, and brings them back from the edge. That is how Pochita and Denji come back in the next scene.' Let the first riff land, then move on; the song keeps playing under the next slides and stops on its own when KICK BACK starts.",
  "chainsaw-man-101":
    "Sixty seconds, for the half of the room that has never seen it. One stage per breath: the debt, the warehouse, the heart. Do not do voices. End on the quote and click straight into the clip.",
  "pochita-dream":
    "After the cord: the clip from episode one, where Pochita offers his heart and asks for Denji's dream. Let it play. It does not advance on its own. Then KICK BACK. If the video will not load on this network, the link opens it on YouTube; or just say the line yourself.",
  "your-dream":
    "Slow down here. 'Denji's dream was bread with jam. What is yours?' Then: 'You have a crew now that will build it with you. Nobody has to approve it.' Land the question and let it hang: what will you build, when you can build anything? Five real seconds of silence. Tell them to hold on to it: you come back to it at the end.",
  "why-these-two":
    "Sixty seconds, and the map of the talk: one section per story. Denji: your dream, starting, proving the work. Reacher: reading the scene, seeing the fight, who it is for. Musashi: where you stand, the Way you already have, a second Way. Point at the covers: none is a software book. Read the first Musashi line — know the ways of all professions — and tell them you are coming back to the second at the very end. Name the thread: all three are people whose fundamentals are so deep they can move fast and still see.",
  "more-and-garbage":
    "Let the truck run behind you: it hauls away the slop, and someone digs through the heap and finds the treasure. One man's trash is another man's treasure. The claim, flat. Then the honest half: 'I generate garbage every day. Some of it is the best way I learn.' The curl line is the proof: an open-source project used by billions of devices ended a six-year bug bounty in January because AI reports drowned the real ones. Land the question: what are you building, what are you solving, and for whom? Then the signature: first principles are how you tell them apart.",
  "two-views":
    "The frame for the whole talk. Walked by the clicker: twelve moments, each click plays on to the next and holds it, so talk over each one; the button names where the next click goes. The valley: 'it's over', then the reframe warms the light and draws the trail up: a fun climb that stretches you. From above, with the eagle: it was easy, the task is complete. The summit: he celebrates alone, no other peaks, the feeling fades, then the range rises and he sees the next one. Reframe: is that what you really want? If it is, go; if not, that's fine too. Say that one neutrally. Then home on the bench: Denji still looking at the next peak, then turning to Pochita, and you turning to Luna. This is the place to say it, in your own words: you only realise later that you should have been present for what you had, instead of craving the next thing. Such is life. Then: 'Nothing on that mountain changed. Only where the camera stood.' Read the title. Then gratitude, and be honest that it is easier said than done: something you resent today might have been your dream a few years ago, or the other way round. 'Hold on to that. Every slide after this is about where you are standing.'",
  "new-surfaces":
    "Musashi was a painter too: his ink birds still hang in museums. Then make it personal: you are a web developer, and you built every 3D scene in this deck with agents. Point back at Pochita. 'The agent knew the words. I knew when it looked wrong.' Ask: what is the surface you have always wanted to try? Land the title: master one Way, then pick up more. The art of mastering one thing teaches you how to master the next.",
  "sift-the-hype":
    "Short. Read the line. Then fill in the two blanks out loud with your own: two tools or habits you still reach for every day, and one that did not survive a month. That honesty is the whole slide. Then Act III.",
  "dream-callback":
    "The callback to the cold open. Slow down. 'At the start I asked for your dream. Hold it up again.' Then the honest part: Denji's dreams kept changing. Each one he reached was smaller than it looked, more a hurdle in his head than a mountain, and reaching it left him empty for a while. If that happens to you, it is normal. Pick the next one. Then hard on this: it is yours. Five seconds of silence, then the Way.",
  "musashi-carry-over":
    "Ask the room, no hands needed: who is good at something that is not code? Most people are. 'That is your Way. Musashi said from one thing, know ten thousand things.' Walk the three stages. If someone in the front row lifts, cooks or plays, use them as the example.",
  "act-1":
    "Ten seconds, after the arrest. He stays quiet until he has a reason to talk. Pull the thread: it is the title's evidence thread, reading the scene this time; the last card is when to talk. The point of the act: the minute you spend reading the scene is the cheapest minute of the build. Then the investigation.",
  "investigation-scene":
    "After the arrest, the reading. Make the point on the side: analysis is the most underused thing AI tools do. People ask them to write; ask them to read. Logs, a stack trace, a diff, a dataset: 'what doesn't fit?' Then let it run one full pass (twenty seconds): he reads six details and circles them. Then: 'They are getting better every month. They still ship mistakes like these with total confidence. Trust it, then verify it.' One or two exhibits is enough. Then Act II.",
  "first-principles":
    "Story first: he sits down to breakfast at Eno's and is arrested before he finishes it, for a murder he did not do. Later he learns the dead man is his brother, Joe. He came for a blues singer and walked into the case. That is every inherited codebase. Then the how-to: 'This works with or without AI, and it works on a 2-million-line repo.' Front door, one path through, the witnesses. Then the act card.",
  "prompt-anatomy":
    "Point at the tree swing first and let the room laugh: everyone in the chain misread what the customer wanted. That was building software before agents: slow, and every hand-off lost something. Agents build fast now, and they still make the same wrong assumptions. Walk the right card slowly and give one real example of your own: a check that looked dead but guarded something, a customer who meant something else. Then: 'When the answer ignores what you know, say no and say why. That pushback is what the years were for.'",
  "act-2":
    "Ten seconds. Pull the thread: the crew from the title arrives again. Bridge: they have read the scene; now they see the fight before it starts, beginning with whether it is worth fighting.",
  "reacher-scene":
    "Let it run one full loop without talking (about ten seconds). Then: 'Elbow, headbutt, reverse elbow. He saw all three before the first one landed. Your prompt is the punch. The plan is everything before it.'",
  "who-asked":
    "Be personal: name one thing you built that nobody asked for, and how long you kept digging. Then: 'Exploring is great. Know which one you are doing.' Then the box: software is turning into a depreciating asset. Building for yourself or for fun is fine; just know the trade-off. Months on a SaaS that never ships is months not spent on something else.",
  "act-3":
    "Ten seconds. Pull the cord: Denji's colours are back. 'This isn't new. We have all shipped a change without opening the app. It worked on my machine.' Agents just do it faster and sound surer. Trust it, then verify it.",
  "one-more-prompt":
    "Bring the energy down on purpose. Admit it: you have done the 1 a.m. 'one more prompt' plenty. Then the turn: the people you meet away from the screen are your future users, and they are what keeps your decisions real. Callback: 'Denji's dream was breakfast with someone. Not a bigger chainsaw.' Then crew and unit. Obviously, apply it to your own life.",
  bio:
    "The first slide once the pre-show ends: who is talking, before what they are saying. Thirty seconds at most: full stack engineer, one line on what you build, and the deadlift joke lands on its own. Then the title.",
  "title":
    "Right after the bio. Three clicks, one per line, in the order the talk tells them. BEAT 1: 'Pull the Cord' — Denji, start before you're ready. BEAT 2: 'Find Your Way' — Musashi, the fundamentals, and where you stand. BEAT 3: 'Bring Backup' — Reacher, read the scene and call in the crew. Then the why: agents let us build in new ways, but human nature hasn't changed. The human condition is universal, and that's why a manga, a 1997 thriller and a 1645 book on swordsmanship still apply. Then the deal for the room: 'This is a conversation. If something lands, or doesn't, put a hand up and we'll talk about it right then.'",
  "perception-gap":
    "Still about where you stand. No study, no numbers: just the feeling. 'Two seconds to an answer feels fast. Count the whole trip, from the problem to it working for a real person, with the re-prompts and the fixing in it.' Then the part people feel but rarely say: when you didn't build it, you can't make a precise edit, so every fix is another round of asking and hoping. Callback: how fast it feels depends on where you stand. Then the training data: these tools learned from public code, good and bad. Frameworks and abstractions can be worth it, and they can also bring bloat and complexity you never needed.",
  "skills-caveman":
    "Second thing the hype leaves out. Be honest: writing a skill that triggers at the right time and changes the result is hard, and most first attempts do neither. So start with ones other people have sharpened. Superpowers for how you work, Anthropic's and Vercel's for new surfaces, caveman for tokens. If someone wants to write their own, point them at skill-creator and tell them to test that it actually fires. Then caveman's joke origin gets a laugh; land that its README lists where it loses.",
  "blast-radius":
    "Security. Open on the line: your agent is an angel in some ways and a devil in others; the Bomb Devil behind you is the second one. Walk the three stages; name the incidents by name, not by fear. The rule to leave them with: scoped tokens, no production credentials, a sandbox, a human on anything that deletes, deploys or pays. Then the crew.",
  questions:
    "Not a Q&A tacked on the end: you have been taking questions all along, so this is the long version. Repeat each question into the mic before answering. If it is quiet, seed one: 'Which mouse are you?' or 'What would you start tonight?' The GitHub line is a shameless plug; say so, and smile. When the room is done, JANE DOE closes it, the same outro as the movie.",
  close:
    "Read it slowly: 'Start somewhere. Let it rip.' No turn-to-your-neighbour. Ask them to reflect, quietly, for ten seconds: if you could let it rip, what would you build? Is it for you, or for your crew? Then: why not both? Thank Michigan DevFest and GDG Detroit by name, then pull the cord: the last pull of the talk, the same cord the title started.",
  "act-look":
    "Ten seconds. Click the brush: the same ensō the title painted. 'Musashi's turn.' Then the line: it's not only where you stand. Your perspective decides what you see. Then into the mountain.",
};

export const devfestPresenterNotes = {
  ...Object.fromEntries(
    devfestSlides.map((s) => [s.id, combinedPresenterNotes[s.id]]).filter(([, n]) => n),
  ),
  ...ownNotes,
};
