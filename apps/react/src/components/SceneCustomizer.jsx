import { useId } from "react";
import {
  AVATAR_CHOICES,
  AVATAR_GROUPS,
  AVATAR_TOGGLES,
} from "../config/avatar";

/**
 * SceneCustomizer — the "make it look like my desk" panel.
 *
 * Collapsed to a single button by default so the landing page stays calm.
 * Single-select axes are real radio groups (arrow-key navigable, unique ids,
 * `<fieldset>`/`<legend>`/`<label>`); boolean props are buttons with
 * `aria-pressed`. Every colour swatch is paired with its name — colour is
 * never the only signal.
 */

const SlidersIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true" {...props}>
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </svg>
);

const CloseIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true" {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

const DiceIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

const ResetIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </svg>
);

const CheckIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const chipBase =
  "flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-mono leading-tight transition-colors cursor-pointer";

const ChoiceGroup = ({ choice, value, onChange, idPrefix }) => {
  const groupName = `${idPrefix}-${choice.id}`;

  return (
    <fieldset className="border-0 p-0 m-0">
      <legend className="mb-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
        {choice.label}
      </legend>
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
                className={`${chipBase} border-gray-700 bg-black/40 text-gray-300 hover:border-gray-500 hover:text-white peer-checked:border-(--color-primary) peer-checked:bg-white/10 peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--color-primary)`}
              >
                {choice.swatch && (
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/25"
                    style={{ backgroundColor: option[choice.swatch] }}
                    aria-hidden="true"
                  />
                )}
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
  <fieldset className="border-0 p-0 m-0">
    <legend className="mb-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
      {legend}
    </legend>
    <div className="flex flex-wrap gap-1.5">
      {toggles.map((toggle) => {
        const on = Boolean(avatar[toggle.id]);
        return (
          <button
            key={toggle.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(toggle.id, !on)}
            className={`${chipBase} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary) ${
              on
                ? "border-(--color-primary) bg-white/10 text-white"
                : "border-gray-700 bg-black/40 text-gray-400 hover:border-gray-500 hover:text-white"
            }`}
          >
            <span
              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                on ? "border-(--color-primary) text-(--color-primary)" : "border-gray-600 text-transparent"
              }`}
              aria-hidden="true"
            >
              <CheckIcon className="h-2.5 w-2.5" />
            </span>
            <span>{toggle.label}</span>
          </button>
        );
      })}
    </div>
  </fieldset>
);

export const SceneCustomizer = ({
  avatar,
  open,
  onToggle,
  onChange,
  onRandomize,
  onReset,
  description = "",
}) => {
  const rawId = useId();
  const idPrefix = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const panelId = `${idPrefix}-scene-customizer`;
  const headingId = `${idPrefix}-scene-customizer-heading`;

  return (
    <div className="absolute right-2 top-2 z-30 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-700 bg-black/70 px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-gray-200 backdrop-blur-md transition-colors hover:border-(--color-primary) hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)"
      >
        {open ? <CloseIcon className="h-3.5 w-3.5" /> : <SlidersIcon className="h-3.5 w-3.5" />}
        <span>{open ? "Close" : "Customize"}</span>
      </button>

      <div
        id={panelId}
        role="group"
        aria-labelledby={headingId}
        hidden={!open}
        className="max-h-[22rem] w-[min(88vw,21rem)] overflow-y-auto rounded-2xl border border-gray-700 bg-black/90 p-3 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3
            id={headingId}
            className="text-[11px] font-mono font-bold uppercase tracking-widest text-(--color-primary)"
          >
            Make it your desk
          </h3>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onRandomize}
              className="flex cursor-pointer items-center gap-1 rounded-lg border border-gray-700 bg-black/60 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-gray-300 transition-colors hover:border-(--color-primary) hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)"
            >
              <DiceIcon className="h-3 w-3" />
              <span>Randomize</span>
            </button>
            <button
              type="button"
              onClick={onReset}
              className="flex cursor-pointer items-center gap-1 rounded-lg border border-gray-700 bg-black/60 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-gray-300 transition-colors hover:border-(--color-primary) hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)"
            >
              <ResetIcon className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {AVATAR_GROUPS.map((group) => {
            const choices = AVATAR_CHOICES.filter((choice) => choice.group === group.id);
            const toggles = AVATAR_TOGGLES.filter((toggle) => toggle.group === group.id);
            if (!choices.length && !toggles.length) return null;

            return (
              <section key={group.id} className="space-y-3">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
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
                    legend={group.id === "character" ? "Accessories" : "Props"}
                  />
                )}
              </section>
            );
          })}
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
