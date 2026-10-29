import { useId, useState } from "react";
import { AVATAR_CHOICES, AVATAR_TOGGLES } from "../config/avatar";
import {
  COMPANION_FAMILIES,
  COMPANION_KINDS,
  MAX_COMPANIONS,
  PLUSH_KINDS,
  companionName,
  findCompanionKind,
} from "../config/sceneItems";
import { Close, Plus, Refresh, Swap } from "./Icons";

/**
 * SceneCustomizer — the Studio: make the desk yours.
 *
 * Built like a character studio, not a settings form. It sits BESIDE the
 * scene at the scene's height (StudentBuildingScene owns that layout), so
 * every change lands where you are already looking:
 *
 *   rail     Looks · You · Desk · Room · Crew · Shelf, one section at a time
 *   head     the section's name, and chips that pick ONE part of it
 *   grid     tiles drawn with the scene's own art (`previews`), a check on the
 *            one you have; colours are round swatches, named in the head
 *   foot     Shuffle and Reset
 *
 * Accessibility: the rail is a vertical tablist; single-select axes are radio
 * groups (arrow keys move through them); toggles are buttons with
 * `aria-pressed`; a swatch is never the only signal — its name is its label
 * and the head repeats the one you picked.
 */

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--stage-accent)";
const PEER_FOCUS = "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--stage-accent)";
const KICKER = "font-mono text-[10px] font-bold uppercase tracking-[0.22em]";
const GRID = "grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2.5";
const muted = { color: "var(--stage-text-muted)" };
const hair = { borderColor: "var(--stage-border)" };
const EASE = "cubic-bezier(.16, 1, .3, 1)";

/** Curated looks: each is a patch of choices, passed to onChange in one go. */
const LOOKS = [
  {
    id: "night",
    label: "Night shift",
    hint: "Dual screens, lamp on, headphones",
    sky: "radial-gradient(120% 90% at 70% 0%, #312e81 0%, #0b1020 60%)",
    set: { backdrop: "night", display: "dual", deskSurface: "ebony", chairColor: "blackMesh", topColor: "charcoal", lamp: true, headphones: true, mug: true },
  },
  {
    id: "golden",
    label: "Golden hour",
    hint: "Daylight, oak, a plant",
    sky: "radial-gradient(120% 90% at 30% 0%, #fde68a 0%, #d8a43f 55%, #8c5b36 100%)",
    set: { backdrop: "day", display: "monitor", deskSurface: "oak", chairColor: "camel", topColor: "mustard", plant: true, lamp: false, headphones: false },
  },
  {
    id: "minimal",
    label: "Minimal",
    hint: "One laptop, nothing else",
    sky: "radial-gradient(120% 90% at 50% 0%, #f6f7f9 0%, #cbd5e1 60%, #64748b 100%)",
    set: { backdrop: "day", display: "laptop", deskSurface: "whiteLaminate", chairColor: "graphite", topColor: "slate", mug: true, plant: false, books: false, lamp: false, mechKeyboard: false, phone: false, bookcase: false, headphones: false },
  },
  {
    id: "collector",
    label: "Collector",
    hint: "Bookcase, books, the works",
    sky: "radial-gradient(120% 90% at 60% 0%, #ff5fa2 0%, #7f1d2e 45%, #12101e 100%)",
    set: { backdrop: "night", display: "monitor", deskSurface: "walnut", chairColor: "crimson", bookcase: true, books: true, plant: true, mechKeyboard: true },
  },
];

/* Rail icons: a soft accent fill under a line, stronger when the section is open. */
const RAIL_ICONS = {
  looks: (
    <>
      <path className="f" d="M12 3l2.2 5.3L20 9l-4.4 3.8L17 18.5 12 15.6 7 18.5l1.4-5.7L4 9l5.8-.7z" />
      <path d="M12 3l2.2 5.3L20 9l-4.4 3.8L17 18.5 12 15.6 7 18.5l1.4-5.7L4 9l5.8-.7z" />
    </>
  ),
  you: (
    <>
      <circle className="f" cx="12" cy="8.5" r="4" />
      <circle cx="12" cy="8.5" r="4" />
      <path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5" />
    </>
  ),
  desk: (
    <>
      <rect className="f" x="4" y="4.5" width="16" height="10" rx="1.5" />
      <rect x="4" y="4.5" width="16" height="10" rx="1.5" />
      <path d="M9 19h6M12 14.5V19M2.5 21.5h19" />
    </>
  ),
  room: (
    <>
      <path className="f" d="M15.5 4.5a7 7 0 1 0 4 12.6A8 8 0 0 1 15.5 4.5z" />
      <path d="M15.5 4.5a7 7 0 1 0 4 12.6A8 8 0 0 1 15.5 4.5z" />
    </>
  ),
  crew: (
    <>
      <ellipse className="f" cx="12" cy="16" rx="4.5" ry="3.8" />
      <ellipse cx="12" cy="16" rx="4.5" ry="3.8" />
      <circle cx="6" cy="10.5" r="1.8" />
      <circle cx="9.5" cy="6.8" r="1.8" />
      <circle cx="14.5" cy="6.8" r="1.8" />
      <circle cx="18" cy="10.5" r="1.8" />
    </>
  ),
  shelf: (
    <>
      <rect className="f" x="6" y="5" width="3" height="7" rx=".5" />
      <path d="M4 3v18M20 3v18M4 12h16M4 20h16M6 12V5h3v7M10.5 12V7h2.5v5M15 12l1.5-6 2.3.6" />
    </>
  ),
};

const SECTIONS = [
  { id: "looks", label: "Looks", title: "Pick a look" },
  {
    id: "you",
    label: "You",
    title: "You",
    parts: [
      { id: "hairStyle", label: "Hair" },
      { id: "hairColor", label: "Colour" },
      { id: "facialHair", label: "Face" },
      { id: "skinTone", label: "Skin" },
      { id: "topColor", label: "Top" },
      { id: "wearing", label: "Extras", toggles: ["glasses", "headphones"] },
    ],
  },
  {
    id: "desk",
    label: "Desk",
    title: "The desk",
    parts: [
      { id: "display", label: "Screen" },
      { id: "props", label: "Props", toggles: ["mug", "plant", "books", "lamp", "mechKeyboard", "phone"] },
      { id: "deskSurface", label: "Surface" },
      { id: "chairColor", label: "Chair" },
    ],
  },
  { id: "room", label: "Room", title: "The room" },
  { id: "crew", label: "Crew", title: "Your crew" },
  { id: "shelf", label: "Shelf", title: "The shelf" },
];

const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
const CHOICES = byId(AVATAR_CHOICES);
const TOGGLES = byId(AVATAR_TOGGLES);

/** Glyphs for the options that have no art of their own in the scene. */
const DISPLAY_ART = {
  laptop: (
    <svg viewBox="0 0 64 40" className="h-full w-full" aria-hidden="true">
      <rect x="14" y="8" width="36" height="22" rx="2" fill="#2a2e37" />
      <rect x="17" y="11" width="30" height="16" rx="1" fill="#0b1626" />
      <path d="M19 15h14M19 19h20M19 23h10" stroke="var(--stage-accent)" strokeWidth="1.6" strokeLinecap="round" opacity=".8" />
      <path d="M8 31h48l-3 3H11z" fill="#3c424e" />
    </svg>
  ),
  monitor: (
    <svg viewBox="0 0 64 40" className="h-full w-full" aria-hidden="true">
      <rect x="10" y="3" width="44" height="27" rx="2" fill="#2a2e37" />
      <rect x="13" y="6" width="38" height="21" rx="1" fill="#0b1626" />
      <path d="M16 11h16M16 15h24M16 19h12M16 23h18" stroke="var(--stage-accent)" strokeWidth="1.6" strokeLinecap="round" opacity=".8" />
      <rect x="29" y="30" width="6" height="5" fill="#2a2e37" />
      <rect x="22" y="35" width="20" height="2.5" rx="1.2" fill="#3c424e" />
    </svg>
  ),
  dual: (
    <svg viewBox="0 0 64 40" className="h-full w-full" aria-hidden="true">
      {[2, 33].map((x) => (
        <g key={x}>
          <rect x={x} y="6" width="29" height="21" rx="2" fill="#2a2e37" />
          <rect x={x + 2.5} y="8.5" width="24" height="16" rx="1" fill="#0b1626" />
          <path d={`M${x + 5} 13h10M${x + 5} 17h15M${x + 5} 21h8`} stroke="var(--stage-accent)" strokeWidth="1.5" strokeLinecap="round" opacity=".8" />
          <rect x={x + 12.5} y="27" width="4" height="6" fill="#2a2e37" />
        </g>
      ))}
      <rect x="10" y="33" width="44" height="2.5" rx="1.2" fill="#3c424e" />
    </svg>
  ),
};

const SKY = {
  night: { bg: "linear-gradient(160deg, #1e1b4b, #0b1020 60%, #12101e)", orb: "radial-gradient(circle at 35% 35%, #fff8e1, #e9d8a6)" },
  day: { bg: "linear-gradient(160deg, #cfe3f2, #e9eef3 55%, #f3e7da)", orb: "radial-gradient(circle, #fff6d8, #f6c453)" },
};

const BOOKCASE_ART = (
  <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
    <rect x="14" y="6" width="36" height="54" rx="2" fill="#6b4226" />
    <rect x="17" y="9" width="30" height="48" fill="#3b2415" />
    {[24, 40].map((y) => (
      <rect key={y} x="17" y={y} width="30" height="3" fill="#6b4226" />
    ))}
    {[
      [19, 13, "#c8102e"],
      [23, 15, "#22d3ee"],
      [27, 12, "#d8a43f"],
      [33, 29, "#4f46e5"],
      [37, 31, "#0d9488"],
      [21, 45, "#e11d8f"],
      [26, 47, "#d8d2c4"],
    ].map(([x, y, c]) => (
      <rect key={`${x}-${y}`} x={x} y={y} width="3.4" height={(y < 24 ? 24 : y < 40 ? 40 : 57) - y} fill={c} />
    ))}
  </svg>
);

/* ---------- tiles ---------- */

/** The ring every selected tile wears. */
const tileStyle = (on) => ({
  borderRadius: 12,
  borderColor: on ? "var(--stage-accent)" : "var(--stage-border)",
  backgroundColor: on ? "rgb(var(--stage-accent-rgb) / 0.08)" : "rgb(255 255 255 / 0.025)",
  boxShadow: on ? "0 0 0 1px var(--stage-accent), 0 10px 24px -14px rgb(var(--stage-accent-rgb) / 0.8)" : "none",
  transition: `transform .18s ${EASE}, border-color .2s, box-shadow .2s, background-color .2s`,
});

const Check = ({ on }) => (
  <span
    aria-hidden="true"
    className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full text-[11px] font-black"
    style={{
      backgroundColor: "var(--stage-accent)",
      color: "var(--stage-on-accent, #05070a)",
      opacity: on ? 1 : 0,
      transform: on ? "none" : "scale(.6)",
      transition: "opacity .18s, transform .25s cubic-bezier(.34, 1.56, .64, 1)",
    }}
  >
    ✓
  </span>
);

const Art = ({ children }) => (
  <span
    className="block aspect-square w-full overflow-hidden"
    style={{ borderRadius: 9, background: "radial-gradient(80% 70% at 50% 35%, rgb(255 255 255 / 0.07), transparent 70%)" }}
  >
    <span className="block h-full w-full p-1.5">{children}</span>
  </span>
);

const TileName = ({ children, on }) => (
  <span className="mt-1.5 block truncate text-center text-[11px] font-semibold" style={{ color: on ? "var(--stage-text)" : "var(--stage-text-muted)" }}>
    {children}
  </span>
);

/** One single-select axis: swatches for colours, art tiles for everything else. */
const ChoiceGrid = ({ choice, value, onChange, idPrefix, previewFor }) => {
  const name = `${idPrefix}-${choice.id}`;
  const swatches = Boolean(choice.swatch);
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">{choice.label}</legend>
      <div className={swatches ? "grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-3" : GRID}>
        {choice.options.map((option) => {
          const id = `${name}-${option.id}`;
          const on = option.id === value;
          return (
            <span key={option.id} className="relative">
              <input type="radio" id={id} name={name} checked={on} onChange={() => onChange(choice.id, option.id)} className="peer sr-only" />
              {swatches ? (
                <label
                  htmlFor={id}
                  title={option.label}
                  className={`block aspect-square cursor-pointer rounded-full hover:scale-110 ${PEER_FOCUS}`}
                  style={{
                    background: option[choice.swatch],
                    boxShadow: on
                      ? "0 0 0 2px var(--stage-bg), 0 0 0 4px var(--stage-accent)"
                      : "inset 0 0 0 1px rgb(255 255 255 / 0.16), inset 0 -6px 10px rgb(0 0 0 / 0.18)",
                    transition: `transform .18s ${EASE}, box-shadow .2s`,
                  }}
                >
                  <span className="sr-only">{option.label}</span>
                </label>
              ) : (
                <label htmlFor={id} className={`relative block cursor-pointer border p-1.5 hover:-translate-y-0.5 ${PEER_FOCUS}`} style={tileStyle(on)}>
                  <Art>{previewFor(option.id)}</Art>
                  <TileName on={on}>{option.label}</TileName>
                  <Check on={on} />
                </label>
              )}
            </span>
          );
        })}
      </div>
    </fieldset>
  );
};

/** A toggle drawn as an art tile. */
const ToggleTile = ({ on, onClick, label, ariaLabel, children, disabled }) => (
  <button
    type="button"
    aria-pressed={on}
    aria-label={ariaLabel}
    onClick={onClick}
    disabled={disabled}
    className={`relative block w-full border p-1.5 text-left hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 ${FOCUS}`}
    style={tileStyle(on)}
  >
    <Art>{children}</Art>
    <TileName on={on}>{label}</TileName>
    <Check on={on} />
  </button>
);

const Chip = ({ on, onClick, children }) => (
  <button
    type="button"
    aria-pressed={on}
    onClick={onClick}
    className={`h-8 shrink-0 rounded-full border px-3.5 text-[12px] font-semibold ${FOCUS}`}
    style={{
      borderColor: on ? "var(--stage-accent)" : "var(--stage-border)",
      backgroundColor: on ? "var(--stage-accent)" : "transparent",
      color: on ? "var(--stage-on-accent, #05070a)" : "var(--stage-text-muted)",
      transition: "background-color .2s, color .2s, border-color .2s",
    }}
  >
    {children}
  </button>
);

const SubHead = ({ children, aside }) => (
  <p className={`${KICKER} mb-2.5 flex items-baseline justify-between`} style={muted}>
    <span>{children}</span>
    {aside}
  </p>
);

/* ---------- sections ---------- */

const Crew = ({ companions, onAdd, onRemove, onVariant, idPrefix, previews }) => {
  const [family, setFamily] = useState(COMPANION_FAMILIES[0].id);
  const full = companions.length >= MAX_COMPANIONS;
  const familyLabel = COMPANION_FAMILIES.find((f) => f.id === family).label;
  return (
    <div className="flex flex-col gap-5">
      <section>
        <SubHead aside={<span>{`${companions.length} / ${MAX_COMPANIONS}`}</span>}>In the scene</SubHead>
        {companions.length === 0 ? (
          <p className="text-xs" style={muted}>
            Nobody yet. Add a pet, a sidekick or a character below.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {companions.map((companion) => {
              const kind = findCompanionKind(companion.kind);
              if (!kind) return null;
              const name = companionName(kind, companion.variant);
              const group = `${idPrefix}-companion-${companion.id}`;
              return (
                <li key={companion.id} className="flex items-center gap-3 border p-2" style={{ ...hair, borderRadius: 12, backgroundColor: "rgb(255 255 255 / 0.025)" }}>
                  <span className="h-12 w-12 shrink-0">{previews.companion(kind, companion.variant)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-sm font-bold" style={{ color: "var(--stage-text)" }}>
                      {name}
                    </p>
                    {kind.variants.length > 1 && (
                      <fieldset className="m-0 mt-1.5 border-0 p-0">
                        <legend className="sr-only">{`${name}: coat`}</legend>
                        <div className="flex flex-wrap gap-1">
                          {kind.variants.map((variant) => {
                            const id = `${group}-${variant.id}`;
                            const on = variant.id === companion.variant;
                            return (
                              <span key={variant.id} className="contents">
                                <input type="radio" id={id} name={group} checked={on} onChange={() => onVariant(companion.id, variant.id)} className="peer sr-only" />
                                <label
                                  htmlFor={id}
                                  className={`cursor-pointer rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${PEER_FOCUS}`}
                                  style={{
                                    borderColor: on ? "var(--stage-accent)" : "var(--stage-border)",
                                    color: on ? "var(--stage-text)" : "var(--stage-text-muted)",
                                    backgroundColor: on ? "rgb(var(--stage-accent-rgb) / 0.12)" : "transparent",
                                  }}
                                >
                                  {variant.label}
                                </label>
                              </span>
                            );
                          })}
                        </div>
                      </fieldset>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(companion.id)}
                    aria-label={`Remove ${name}`}
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${FOCUS}`}
                    style={{ color: "var(--stage-text-muted)", backgroundColor: "rgb(255 255 255 / 0.04)" }}
                  >
                    <Close className="h-3 w-3" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <SubHead>Add to the scene</SubHead>
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          {COMPANION_FAMILIES.map((f) => (
            <Chip key={f.id} on={f.id === family} onClick={() => setFamily(f.id)}>
              {f.label}
            </Chip>
          ))}
        </div>
        <fieldset className="m-0 border-0 p-0" disabled={full}>
          <legend className="sr-only">{`Add ${familyLabel.toLowerCase()}`}</legend>
          <div className={GRID}>
            {COMPANION_KINDS.filter((kind) => kind.family === family).map((kind) => (
              <button
                key={kind.id}
                type="button"
                onClick={() => onAdd(kind.id)}
                aria-label={`Add ${kind.label}${kind.theme ? ` (${kind.theme})` : ""}`}
                title={kind.theme}
                className={`relative block border p-1.5 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
                style={tileStyle(false)}
              >
                <Art>{previews.companion(kind, kind.variants[0]?.id)}</Art>
                <TileName>{kind.label}</TileName>
                <span
                  aria-hidden="true"
                  className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full"
                  style={{ backgroundColor: "rgb(var(--stage-accent-rgb) / 0.18)", color: "var(--stage-accent)" }}
                >
                  <Plus className="h-3 w-3" />
                </span>
              </button>
            ))}
          </div>
        </fieldset>
        {full && (
          <p className="mt-3 text-xs" style={muted}>
            The scene is full. Remove someone to add another.
          </p>
        )}
      </section>
    </div>
  );
};

const Shelf = ({ plushies, bookcase, onToggle, onBookcase, previews }) => {
  const owned = new Set(plushies.map((p) => p.kind));
  const themes = [...new Set(PLUSH_KINDS.map((k) => k.theme))];
  return (
    <div className="flex flex-col gap-5">
      {!bookcase && (
        <div className="flex items-center justify-between gap-3 border p-3" style={{ ...hair, borderRadius: 12 }}>
          <span className="text-xs" style={muted}>
            The shelf lives on the bookcase.
          </span>
          <Chip on onClick={onBookcase}>
            Add bookcase
          </Chip>
        </div>
      )}
      <fieldset className="m-0 flex flex-col gap-5 border-0 p-0" disabled={!bookcase}>
        <legend className="sr-only">Plushies</legend>
        {themes.map((theme) => (
          <section key={theme}>
            <SubHead>{theme}</SubHead>
            <div className={GRID}>
              {PLUSH_KINDS.filter((k) => k.theme === theme).map((kind) => (
                <ToggleTile key={kind.id} on={owned.has(kind.id)} onClick={() => onToggle(kind.id)} label={kind.label} ariaLabel={`${kind.label} plushie`} disabled={!bookcase}>
                  {previews.plush(kind)}
                </ToggleTile>
              ))}
            </div>
          </section>
        ))}
      </fieldset>
    </div>
  );
};

export const SceneCustomizer = ({
  avatar,
  previews,
  onChange,
  onRandomize,
  onReset,
  onAddCompanion = () => {},
  onRemoveCompanion = () => {},
  onCompanionVariant = () => {},
  onTogglePlush = () => {},
  description = "",
}) => {
  const rawId = useId();
  const idPrefix = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const headingId = `${idPrefix}-studio-heading`;
  const [tab, setTab] = useState("looks");
  const [parts, setParts] = useState({ you: "hairStyle", desk: "display" });
  const section = SECTIONS.find((s) => s.id === tab);
  const part = section.parts?.find((p) => p.id === parts[tab]) ?? section.parts?.[0];

  const lookOn = (look) =>
    Object.entries(look.set).every(([key, value]) => (typeof value === "boolean" ? Boolean(avatar[key]) === value : avatar[key] === value));

  /** Each axis's tile art: a bust of you for the person, a glyph for the screen. */
  const previewFor = (axis) => (optionId) => (axis === "display" ? DISPLAY_ART[optionId] ?? null : previews.head({ [axis]: optionId }));

  const picked = part && CHOICES[part.id] ? CHOICES[part.id].options.find((o) => o.id === avatar[part.id])?.label : null;

  const onRailKey = (event) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const i = SECTIONS.findIndex((s) => s.id === tab);
    const next = SECTIONS[(i + step + SECTIONS.length) % SECTIONS.length];
    setTab(next.id);
    document.getElementById(`${idPrefix}-tab-${next.id}`)?.focus();
  };

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      /*
       * `relative` is load-bearing. The radios are `sr-only`, i.e. absolutely
       * positioned; without a positioned ancestor INSIDE the studio they are
       * laid out against the page, and focusing one scrolls the page to them.
       */
      className="relative flex h-[34rem] border-t @3xl:absolute @3xl:inset-0 @3xl:h-auto @3xl:border-l @3xl:border-t-0"
      style={{ ...hair, backgroundColor: "rgb(255 255 255 / 0.018)" }}
    >
      <style>{`
        .studio-rail svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
        .studio-rail svg .f { fill: rgb(var(--stage-accent-rgb) / 0.16); stroke: none; transition: fill .2s; }
        .studio-rail [aria-selected="true"] svg .f { fill: rgb(var(--stage-accent-rgb) / 0.55); }
      `}</style>

      {/* ---- rail ---- */}
      <div
        role="tablist"
        aria-label="Studio sections"
        aria-orientation="vertical"
        onKeyDown={onRailKey}
        className="studio-rail flex w-[4.25rem] shrink-0 flex-col gap-1 overflow-y-auto border-r px-1.5 py-3"
        style={hair}
      >
        {SECTIONS.map((s) => {
          const on = s.id === tab;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              id={`${idPrefix}-tab-${s.id}`}
              aria-selected={on}
              aria-controls={`${idPrefix}-panel`}
              tabIndex={on ? 0 : -1}
              onClick={() => setTab(s.id)}
              className={`flex flex-col items-center gap-1 rounded-[10px] px-1 py-2.5 text-[10.5px] font-semibold ${FOCUS}`}
              style={{
                color: on ? "var(--stage-text)" : "var(--stage-text-muted)",
                backgroundColor: on ? "rgb(var(--stage-accent-rgb) / 0.1)" : "transparent",
                boxShadow: on ? "inset 3px 0 0 var(--stage-accent)" : "none",
                transition: "background-color .2s, color .2s",
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {RAIL_ICONS[s.id]}
              </svg>
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ---- body ---- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="px-4 pb-3 pt-4">
          <h3 id={headingId} className={`${KICKER} m-0`} style={{ color: "var(--stage-accent)" }}>
            Studio
          </h3>
          <p className="m-0 mt-1 flex items-baseline justify-between gap-3">
            <span className="text-[1.6rem] font-black leading-none tracking-tight" style={{ color: "var(--stage-text)" }}>
              {section.title}
            </span>
            {picked && (
              <span className="truncate text-xs font-semibold" style={muted}>
                {picked}
              </span>
            )}
          </p>
          {section.parts && (
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
              {section.parts.map((p) => (
                <Chip key={p.id} on={p.id === part.id} onClick={() => setParts((prev) => ({ ...prev, [tab]: p.id }))}>
                  {p.label}
                </Chip>
              ))}
            </div>
          )}
        </div>

        <div
          role="tabpanel"
          id={`${idPrefix}-panel`}
          aria-labelledby={`${idPrefix}-tab-${tab}`}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t px-4 pb-6 pt-4"
          style={hair}
        >
          {tab === "looks" && (
            <div className="grid grid-cols-2 gap-2.5">
              {LOOKS.map((look) => {
                const on = lookOn(look);
                return (
                  <button
                    key={look.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onChange(look.set)}
                    className={`relative block overflow-hidden border text-left hover:-translate-y-0.5 ${FOCUS}`}
                    style={{ ...tileStyle(on), padding: 0 }}
                  >
                    <span className="relative block aspect-[5/4]" style={{ background: look.sky }}>
                      <span className="absolute inset-x-0 bottom-0 mx-auto block h-[88%] w-[78%]">{previews.head(look.set)}</span>
                    </span>
                    <span className="block px-2.5 py-2">
                      <span className="block truncate text-[13px] font-bold" style={{ color: "var(--stage-text)" }}>
                        {look.label}
                      </span>
                      <span className="block truncate text-[10.5px]" style={muted}>
                        {look.hint}
                      </span>
                    </span>
                    <Check on={on} />
                  </button>
                );
              })}
            </div>
          )}

          {(tab === "you" || tab === "desk") &&
            (part.toggles ? (
              <div className={GRID}>
                {part.toggles.map((id) => (
                  <ToggleTile key={id} on={Boolean(avatar[id])} onClick={() => onChange(id, !avatar[id])} label={TOGGLES[id].label}>
                    {tab === "you" ? previews.head({ [id]: true }) : previews.prop(id)}
                  </ToggleTile>
                ))}
              </div>
            ) : (
              <ChoiceGrid choice={CHOICES[part.id]} value={avatar[part.id]} onChange={onChange} idPrefix={idPrefix} previewFor={previewFor(part.id)} />
            ))}

          {tab === "room" && (
            <div className="flex flex-col gap-5">
              <section>
                <SubHead>Time of day</SubHead>
                <fieldset className="m-0 border-0 p-0">
                  <legend className="sr-only">{CHOICES.backdrop.label}</legend>
                  <div className="grid grid-cols-2 gap-2.5">
                    {CHOICES.backdrop.options.map((option) => {
                      const id = `${idPrefix}-backdrop-${option.id}`;
                      const on = avatar.backdrop === option.id;
                      const sky = SKY[option.id] ?? SKY.night;
                      return (
                        <span key={option.id} className="relative">
                          <input type="radio" id={id} name={`${idPrefix}-backdrop`} checked={on} onChange={() => onChange("backdrop", option.id)} className="peer sr-only" />
                          <label htmlFor={id} className={`relative block cursor-pointer border p-1.5 hover:-translate-y-0.5 ${PEER_FOCUS}`} style={tileStyle(on)}>
                            <span className="relative block aspect-[4/3] overflow-hidden" style={{ borderRadius: 9, background: sky.bg }}>
                              <span
                                className="absolute right-[18%] top-[18%] aspect-square h-[28%] rounded-full"
                                style={{ background: sky.orb, boxShadow: "0 0 24px rgb(255 240 200 / 0.4)" }}
                              />
                            </span>
                            <TileName on={on}>{option.label}</TileName>
                            <Check on={on} />
                          </label>
                        </span>
                      );
                    })}
                  </div>
                </fieldset>
              </section>
              <section>
                <SubHead>Furniture</SubHead>
                <div className={GRID}>
                  <ToggleTile on={Boolean(avatar.bookcase)} onClick={() => onChange("bookcase", !avatar.bookcase)} label={TOGGLES.bookcase.label}>
                    {BOOKCASE_ART}
                  </ToggleTile>
                </div>
              </section>
            </div>
          )}

          {tab === "crew" && (
            <Crew companions={avatar.companions || []} onAdd={onAddCompanion} onRemove={onRemoveCompanion} onVariant={onCompanionVariant} idPrefix={idPrefix} previews={previews} />
          )}

          {tab === "shelf" && (
            <Shelf plushies={avatar.plushies || []} bookcase={Boolean(avatar.bookcase)} onToggle={onTogglePlush} onBookcase={() => onChange("bookcase", true)} previews={previews} />
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t px-4 py-2.5" style={hair}>
          <span className="text-[11px]" style={muted}>
            Drag anything in the scene to move it.
          </span>
          <div className="flex gap-1.5">
            {[
              { label: "Shuffle", icon: Swap, onClick: onRandomize },
              { label: "Reset", icon: Refresh, onClick: onReset },
            ].map(({ label, icon: Icon, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11.5px] font-semibold ${FOCUS}`}
                style={{ ...hair, color: "var(--stage-text-muted)" }}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Announce the resulting scene so the change is perceivable without sight. */}
      <p className="sr-only" aria-live="polite">
        {description}
      </p>
    </div>
  );
};

export default SceneCustomizer;
