import { useId } from "react";
import {
  AVATAR_CHOICES,
  AVATAR_GROUPS,
  AVATAR_TOGGLES,
} from "../config/avatar";
import {
  COMPANION_FAMILIES,
  COMPANION_KINDS,
  MAX_COMPANIONS,
  PLUSH_KINDS,
  companionName,
  findCompanionKind,
} from "../config/sceneItems";
import { Checkmark, Close, Info, Plus, Refresh, Settings, Swap } from "./Icons";

/**
 * SceneCustomizer — the "make it look like my desk" panel.
 *
 * It is a COLUMN, not an overlay. The scene puts it beside the illustration
 * when there is room and underneath when there is not, so you can always see
 * the thing you are changing while you change it.
 *
 * Single-select axes are real radio groups (arrow-key navigable, unique ids,
 * `<fieldset>`/`<legend>`/`<label>`); boolean props are buttons with
 * `aria-pressed`. Every colour swatch is paired with its name — colour is
 * never the only signal.
 *
 * Every colour here comes from a design token, so the panel keeps its contrast
 * in both modes and under every theme: the `--color-primary` /
 * `--color-primary-text` pair is contrast-checked by the theme resolver, and
 * text/muted/border/surface flip with `.dark`.
 */

/** One height for every control in the panel, so the density reads as designed. */
const CONTROL = "h-8 rounded-lg border px-2.5 text-[11px] font-mono leading-none";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)";

const PEER_FOCUS =
  "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--color-primary)";

/** Resting state: surface + border + body text, i.e. the same as a card. */
const CHIP_OFF =
  "border-(--color-border) bg-(--color-surface) text-(--color-text) hover:border-(--color-primary) " +
  "dark:border-(--color-border-dark) dark:bg-(--color-surface-hover-dark) dark:text-(--color-text-dark)";

/** Selected state: the contrast-checked brand pair, identical in both modes. */
const CHIP_ON = "border-(--color-primary) bg-(--color-primary) text-(--color-primary-text)";

const CHIP_BASE = `${CONTROL} inline-flex cursor-pointer select-none items-center gap-2 transition-colors`;

const SECONDARY_BUTTON =
  `${CONTROL} ${FOCUS} inline-flex cursor-pointer items-center gap-1.5 uppercase tracking-wider transition-colors ` +
  "border-(--color-border) bg-(--color-surface) text-(--color-text) hover:border-(--color-primary) " +
  "dark:border-(--color-border-dark) dark:bg-(--color-surface-hover-dark) dark:text-(--color-text-dark)";

const LEGEND =
  "mb-1.5 text-[10px] font-mono font-bold uppercase tracking-widest " +
  "text-(--color-muted-text) dark:text-(--color-muted-text-dark)";

const Swatch = ({ color }) => (
  <span
    className="h-4 w-4 shrink-0 rounded-full border border-(--color-border) dark:border-(--color-border-dark)"
    style={{ backgroundColor: color }}
    aria-hidden="true"
  />
);

const ChoiceGroup = ({ choice, value, onChange, idPrefix }) => {
  const groupName = `${idPrefix}-${choice.id}`;

  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className={LEGEND}>{choice.label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {choice.options.map((option) => {
          const optionId = `${groupName}-${option.id}`;
          const selected = option.id === value;

          return (
            <span key={option.id} className="contents">
              <input
                type="radio"
                id={optionId}
                name={groupName}
                value={option.id}
                checked={selected}
                onChange={() => onChange(choice.id, option.id)}
                className="peer sr-only"
              />
              <label
                htmlFor={optionId}
                className={`${CHIP_BASE} ${PEER_FOCUS} ${selected ? CHIP_ON : CHIP_OFF}`}
              >
                {choice.swatch && <Swatch color={option[choice.swatch]} />}
                <span>{option.label}</span>
              </label>
            </span>
          );
        })}
      </div>
    </fieldset>
  );
};

const ToggleGroup = ({ toggles, avatar, onChange, legend }) => (
  <fieldset className="m-0 border-0 p-0">
    <legend className={LEGEND}>{legend}</legend>
    <div className="flex flex-wrap gap-1.5">
      {toggles.map((toggle) => {
        const on = Boolean(avatar[toggle.id]);
        return (
          <button
            key={toggle.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(toggle.id, !on)}
            className={`${CHIP_BASE} ${FOCUS} ${on ? CHIP_ON : CHIP_OFF}`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                on
                  ? "border-current"
                  : "border-(--color-muted-text) dark:border-(--color-muted-text-dark)"
              }`}
              aria-hidden="true"
            >
              {on && <Checkmark className="h-3 w-3" />}
            </span>
            <span>{toggle.label}</span>
          </button>
        );
      })}
    </div>
  </fieldset>
);

/** Group a list by one of its keys, keeping first-seen order. */
const groupBy = (items, key) => {
  const groups = new Map();
  items.forEach((item) => {
    if (!groups.has(item[key])) groups.set(item[key], []);
    groups.get(item[key]).push(item);
  });
  return [...groups.entries()];
};

/**
 * Companions are a list, not a toggle: each one added gets its own row, with
 * its coat as a radio group and a labelled remove button. Adding is a set of
 * plain buttons grouped by family, disabled once the scene is full.
 */
const CompanionSection = ({ companions, onAdd, onRemove, onVariant, idPrefix }) => {
  const full = companions.length >= MAX_COMPANIONS;

  return (
    <section className="space-y-3 px-3 py-3">
      <div className="flex items-baseline justify-between">
        <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-(--color-text) dark:text-(--color-text-dark)">
          Companions
        </h4>
        <span className="text-[10px] font-mono text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
          {companions.length} / {MAX_COMPANIONS}
        </span>
      </div>

      {companions.length > 0 && (
        <ul className="m-0 list-none space-y-2 p-0">
          {companions.map((companion) => {
            const kind = findCompanionKind(companion.kind);
            if (!kind) return null;
            const name = companionName(kind, companion.variant);
            const groupName = `${idPrefix}-companion-${companion.id}`;

            return (
              <li
                key={companion.id}
                className="rounded-lg border border-(--color-border) p-2 dark:border-(--color-border-dark)"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold text-(--color-text) dark:text-(--color-text-dark)">
                    {name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(companion.id)}
                    aria-label={`Remove ${name}`}
                    className={`${SECONDARY_BUTTON} h-7`}
                  >
                    <Close className="h-3 w-3" />
                    <span>Remove</span>
                  </button>
                </div>
                {kind.variants.length > 1 && (
                  <fieldset className="m-0 mt-2 border-0 p-0">
                    <legend className="sr-only">{`${name}: coat`}</legend>
                    <div className="flex flex-wrap gap-1.5">
                      {kind.variants.map((variant) => {
                        const optionId = `${groupName}-${variant.id}`;
                        const selected = variant.id === companion.variant;
                        return (
                          <span key={variant.id} className="contents">
                            <input
                              type="radio"
                              id={optionId}
                              name={groupName}
                              checked={selected}
                              onChange={() => onVariant(companion.id, variant.id)}
                              className="peer sr-only"
                            />
                            <label
                              htmlFor={optionId}
                              className={`${CHIP_BASE} ${PEER_FOCUS} ${selected ? CHIP_ON : CHIP_OFF}`}
                            >
                              {variant.label}
                            </label>
                          </span>
                        );
                      })}
                    </div>
                  </fieldset>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {COMPANION_FAMILIES.map((family) => (
        <fieldset key={family.id} className="m-0 border-0 p-0" disabled={full}>
          <legend className={LEGEND}>{`Add ${family.label.toLowerCase()}`}</legend>
          <div className="flex flex-wrap gap-1.5">
            {COMPANION_KINDS.filter((kind) => kind.family === family.id).map((kind) => (
              <button
                key={kind.id}
                type="button"
                onClick={() => onAdd(kind.id)}
                aria-label={`Add ${kind.label}${kind.theme ? ` (${kind.theme})` : ""}`}
                title={kind.theme}
                className={`${CHIP_BASE} ${FOCUS} ${CHIP_OFF} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <Plus className="h-3 w-3" />
                <span>{kind.label}</span>
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      {full && (
        <p className="text-[11px] text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
          The scene is full. Remove a companion to add another.
        </p>
      )}
    </section>
  );
};

/** One of each plushie, grouped by the theme it comes from. */
const PlushSection = ({ plushies, bookcase, onToggle }) => {
  const owned = new Set(plushies.map((plush) => plush.kind));

  return (
    <section className="space-y-3 px-3 py-3">
      <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-(--color-text) dark:text-(--color-text-dark)">
        Bookcase plushies
      </h4>
      {!bookcase && (
        <p className="text-[11px] text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
          Turn on the bookcase under Scene to shelve plushies.
        </p>
      )}
      {groupBy(PLUSH_KINDS, "theme").map(([theme, kinds]) => (
        <fieldset key={theme} className="m-0 border-0 p-0" disabled={!bookcase}>
          <legend className={LEGEND}>{theme}</legend>
          <div className="flex flex-wrap gap-1.5">
            {kinds.map((kind) => {
              const on = owned.has(kind.id);
              return (
                <button
                  key={kind.id}
                  type="button"
                  aria-pressed={on}
                  aria-label={`${kind.label} plushie`}
                  onClick={() => onToggle(kind.id)}
                  className={`${CHIP_BASE} ${FOCUS} ${on ? CHIP_ON : CHIP_OFF} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      on ? "border-current" : "border-(--color-muted-text) dark:border-(--color-muted-text-dark)"
                    }`}
                    aria-hidden="true"
                  >
                    {on && <Checkmark className="h-3 w-3" />}
                  </span>
                  <span>{kind.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </section>
  );
};

export const SceneCustomizer = ({
  avatar,
  open,
  onToggle,
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
  const panelId = `${idPrefix}-scene-customizer`;
  const headingId = `${idPrefix}-scene-customizer-heading`;
  const hintId = `${idPrefix}-scene-customizer-hint`;

  return (
    <div className={`flex shrink-0 flex-col gap-2 ${open ? "@3xl:w-[21rem]" : ""}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={
          `${CONTROL} ${FOCUS} inline-flex cursor-pointer items-center justify-center gap-1.5 self-start ` +
          "border-(--color-primary) bg-(--color-primary) font-bold uppercase tracking-wider " +
          "text-(--color-primary-text) transition-opacity hover:opacity-90"
        }
      >
        {open ? <Close className="h-3.5 w-3.5" /> : <Settings className="h-3.5 w-3.5" />}
        <span>{open ? "Close" : "Customize scene"}</span>
      </button>

      <div
        id={panelId}
        role="group"
        aria-labelledby={headingId}
        aria-describedby={hintId}
        hidden={!open}
        /*
         * `relative` is load-bearing. The radios are `sr-only`, i.e. absolutely
         * positioned; without a positioned ancestor INSIDE this scroller they are
         * laid out against the scene card instead, at their unscrolled offset far
         * below the fold. Clicking a chip focuses its radio, and the browser then
         * scrolls the card's overflow-hidden box to reach it — the scene vanishes.
         */
        className={
          "relative rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-lg " +
          "dark:border-(--color-border-dark) dark:bg-(--color-surface-dark) " +
          "@3xl:max-h-[34rem] @3xl:overflow-y-auto"
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--color-border) px-3 py-2.5 dark:border-(--color-border-dark)">
          <h3
            id={headingId}
            className="text-[11px] font-mono font-bold uppercase tracking-widest text-(--color-text) dark:text-(--color-text-dark)"
          >
            Make it your desk
          </h3>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={onRandomize} className={SECONDARY_BUTTON}>
              <Swap className="h-3 w-3" />
              <span>Randomize</span>
            </button>
            <button type="button" onClick={onReset} className={SECONDARY_BUTTON}>
              <Refresh className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <p
          id={hintId}
          className="flex items-start gap-2 border-b border-(--color-border) px-3 py-2.5 text-[11px] leading-relaxed text-(--color-muted-text) dark:border-(--color-border-dark) dark:text-(--color-muted-text-dark)"
        >
          <Info className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>
            Props, companions and plushies can be moved. Drag one in the scene, or tab to it
            and nudge it with the arrow keys — hold shift for larger steps. Up and down move a
            plushie between shelves.
          </span>
        </p>

        <div className="divide-y divide-(--color-border) dark:divide-(--color-border-dark)">
          {AVATAR_GROUPS.map((group) => {
            const choices = AVATAR_CHOICES.filter((choice) => choice.group === group.id);
            const toggles = AVATAR_TOGGLES.filter((toggle) => toggle.group === group.id);
            if (!choices.length && !toggles.length) return null;

            return (
              <section key={group.id} className="space-y-3 px-3 py-3">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-(--color-text) dark:text-(--color-text-dark)">
                  {group.label}
                </h4>
                {choices.map((choice) => (
                  <ChoiceGroup
                    key={choice.id}
                    choice={choice}
                    value={avatar[choice.id]}
                    onChange={onChange}
                    idPrefix={idPrefix}
                  />
                ))}
                {toggles.length > 0 && (
                  <ToggleGroup
                    toggles={toggles}
                    avatar={avatar}
                    onChange={onChange}
                    legend={
                      group.id === "character" ? "Accessories" : group.id === "scene" ? "Furniture" : "Props"
                    }
                  />
                )}
              </section>
            );
          })}
          <CompanionSection
            companions={avatar.companions || []}
            onAdd={onAddCompanion}
            onRemove={onRemoveCompanion}
            onVariant={onCompanionVariant}
            idPrefix={idPrefix}
          />
          <PlushSection
            plushies={avatar.plushies || []}
            bookcase={Boolean(avatar.bookcase)}
            onToggle={onTogglePlush}
          />
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
