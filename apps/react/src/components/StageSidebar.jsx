import { useEffect, useMemo, useRef } from "react";
import { Close } from "./Icons";
import {
  RUNTIMES,
  RUNTIME_ORDER,
  formatRuntimeLength,
  selectSlides,
  slideBudget,
  formatClock,
} from "../data/slides/runtime";

/**
 * StageSidebar — deck, runtime and flex-zone selection, out of the way.
 *
 * These controls used to be a strip across the top of every slide. That strip
 * spent the most valuable real estate on stage — the top of a projected slide —
 * on decisions you make once, before you start talking. So they live here now:
 * a drawer you open when you need it and close to get the whole slide back.
 *
 * It opens from the RIGHT on purpose. On /slides the app's own nav parks at the
 * bottom-left, and a left drawer would slide straight over it.
 *
 * Each runtime shows what it will actually present for the current deck — the
 * slide count and the planned time — because "Standard 60m" is a promise and
 * the speaker needs to see whether the deck keeps it before choosing.
 */

const plannedFor = (slides, runtimeId, openZones) => {
  const selected = selectSlides(slides, { runtime: runtimeId, openZones });
  return {
    count: selected.length,
    seconds: selected.reduce((sum, s) => sum + slideBudget(s), 0),
  };
};

export const StageSidebar = ({
  isOpen,
  onClose,
  deckTitle,
  allSlides,
  runtimeId,
  onRuntimeChange,
  flexZones,
  openZones,
  onToggleZone,
  liveDecks,
  shelvedDecks,
  activeDeckId,
  onSelectDeck,
}) => {
  const panelRef = useRef(null);
  const openerRef = useRef(null);

  const plans = useMemo(
    () =>
      Object.fromEntries(
        RUNTIME_ORDER.map((id) => [id, plannedFor(allSlides, id, openZones)])
      ),
    [allSlides, openZones]
  );

  // Focus in on open, back to the opener on close, Escape closes, Tab stays inside.
  useEffect(() => {
    if (!isOpen) return undefined;
    openerRef.current = document.activeElement;

    const checked = panelRef.current?.querySelector('input[name="stage-runtime"]:checked');
    (checked ?? panelRef.current?.querySelector("button"))?.focus?.();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), summary, [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      openerRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        ref={panelRef}
        id="stage-sidebar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stage-sidebar-title"
        inert={!isOpen}
        className={`fixed top-0 right-0 bottom-0 z-[71] w-[min(92vw,24rem)] flex flex-col
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{
          backgroundColor: "var(--stage-surface)",
          borderLeft: "var(--stage-hairline) solid var(--stage-border-strong)",
          color: "var(--stage-text)",
        }}
      >
        <header
          className="flex items-start justify-between gap-3 p-4"
          style={{ borderBottom: "var(--stage-hairline) solid var(--stage-border)" }}
        >
          <div className="min-w-0">
            <p className="stage-kicker mb-2">Presenter</p>
            <h2 id="stage-sidebar-title" className="text-base font-black uppercase tracking-tight m-0">
              Deck &amp; runtime
            </h2>
            <p className="text-xs mt-1 m-0 truncate" style={{ color: "var(--stage-text-muted)" }}>
              {deckTitle}
            </p>
          </div>
          <button
            type="button"
            id="stage-sidebar-close"
            onClick={onClose}
            aria-label="Close presenter sidebar"
            className="stage-btn shrink-0"
            style={{ padding: "0.4em" }}
          >
            <Close className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* ---- Runtime ---- */}
          <fieldset className="m-0 p-0 border-0 space-y-1.5">
            <legend className="stage-kicker mb-2">Runtime</legend>
            {RUNTIME_ORDER.map((id, i) => {
              const rt = RUNTIMES[id];
              const plan = plans[id];
              const isChecked = id === runtimeId;
              return (
                <label
                  key={id}
                  htmlFor={`stage-runtime-${id}`}
                  className="flex items-start gap-3 p-2.5 cursor-pointer transition-colors"
                  style={{
                    borderRadius: "var(--stage-radius)",
                    border: `var(--stage-hairline) solid ${isChecked ? "var(--stage-accent)" : "var(--stage-border)"}`,
                    backgroundColor: isChecked ? "rgb(var(--stage-accent-rgb) / 0.1)" : "transparent",
                  }}
                >
                  <input
                    type="radio"
                    name="stage-runtime"
                    id={`stage-runtime-${id}`}
                    value={id}
                    checked={isChecked}
                    onChange={() => onRuntimeChange(id)}
                    className="mt-1 shrink-0 accent-(--stage-accent)"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-bold">{rt.label}</span>
                      <span className="text-[11px] font-mono shrink-0" style={{ color: "var(--stage-text-muted)" }}>
                        {formatRuntimeLength(rt.minutes)} &middot; key {i + 1}
                      </span>
                    </span>
                    <span className="block text-xs mt-0.5 leading-snug" style={{ color: "var(--stage-text-muted)" }}>
                      {rt.blurb}
                    </span>
                    <span className="block text-[11px] font-mono mt-1" style={{ color: "var(--stage-accent)" }}>
                      {plan.count} slides &middot; {formatClock(plan.seconds)} planned
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          {/* ---- Flex zones ---- */}
          {flexZones.length > 0 && (
            <section aria-labelledby="stage-sidebar-zones">
              <h3 id="stage-sidebar-zones" className="stage-kicker mb-2">
                Flex zones
              </h3>
              <ul className="list-none m-0 p-0 space-y-1.5">
                {flexZones.map((zone) => {
                  const isOpenZone = openZones.includes(zone.id);
                  return (
                    <li key={zone.id}>
                      <button
                        type="button"
                        id={`stage-zone-${zone.id}`}
                        onClick={() => onToggleZone(zone.id)}
                        aria-pressed={isOpenZone}
                        className="w-full flex items-center justify-between gap-2 p-2.5 text-left cursor-pointer transition-colors"
                        style={{
                          borderRadius: "var(--stage-radius)",
                          border: `var(--stage-hairline) solid ${isOpenZone ? "var(--stage-accent)" : "var(--stage-border)"}`,
                          backgroundColor: isOpenZone ? "rgb(var(--stage-accent-rgb) / 0.1)" : "transparent",
                          color: "var(--stage-text)",
                        }}
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-bold">{zone.label}</span>
                          <span className="block text-xs" style={{ color: "var(--stage-text-muted)" }}>
                            {zone.slides.length} slides &middot; {formatClock(zone.seconds)} of standing material
                          </span>
                        </span>
                        <span className="text-[11px] font-mono shrink-0" style={{ color: "var(--stage-accent)" }}>
                          {isOpenZone ? "Open" : "Closed"} &middot; Z
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* ---- Decks ---- */}
          <section aria-labelledby="stage-sidebar-decks">
            <h3 id="stage-sidebar-decks" className="stage-kicker mb-2">
              Decks
            </h3>
            <ul className="list-none m-0 p-0 space-y-1.5">
              {liveDecks.map((deck) => (
                <DeckRow key={deck.id} deck={deck} isCurrent={deck.id === activeDeckId} onSelect={onSelectDeck} />
              ))}
            </ul>

            {shelvedDecks.length > 0 && (
              <details className="mt-3">
                <summary
                  className="cursor-pointer text-xs font-mono uppercase tracking-wider py-1"
                  style={{ color: "var(--stage-text-muted)" }}
                >
                  Shelf &middot; {shelvedDecks.length} source decks
                </summary>
                <ul className="list-none m-0 p-0 mt-2 space-y-1.5">
                  {shelvedDecks.map((deck) => (
                    <DeckRow key={deck.id} deck={deck} isCurrent={deck.id === activeDeckId} onSelect={onSelectDeck} />
                  ))}
                </ul>
              </details>
            )}
          </section>
        </div>

        <footer
          className="p-3 text-[11px] font-mono leading-relaxed"
          style={{ borderTop: "var(--stage-hairline) solid var(--stage-border)", color: "var(--stage-text-muted)" }}
        >
          S sidebar &middot; 1&ndash;5 runtime &middot; Z flex zone &middot; N notes &middot; F fullscreen &middot; Esc close
        </footer>
      </aside>
    </>
  );
};

const DeckRow = ({ deck, isCurrent, onSelect }) => (
  <li>
    <button
      type="button"
      id={`stage-deck-${deck.id}`}
      onClick={() => onSelect(deck.id)}
      aria-current={isCurrent ? "true" : undefined}
      className="w-full p-2.5 text-left cursor-pointer transition-colors"
      style={{
        borderRadius: "var(--stage-radius)",
        border: `var(--stage-hairline) solid ${isCurrent ? "var(--stage-accent)" : "var(--stage-border)"}`,
        backgroundColor: isCurrent ? "rgb(var(--stage-accent-rgb) / 0.1)" : "transparent",
        color: "var(--stage-text)",
      }}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold truncate">{deck.title}</span>
        <span className="text-[11px] font-mono shrink-0" style={{ color: "var(--stage-text-muted)" }}>
          {deck.slideCount} slides
        </span>
      </span>
      {deck.subtitle && (
        <span className="block text-xs mt-0.5 leading-snug" style={{ color: "var(--stage-text-muted)" }}>
          {deck.subtitle}
        </span>
      )}
      {deck.shelfReason && (
        <span className="block text-[11px] italic mt-1" style={{ color: "var(--stage-text-dim)" }}>
          {deck.shelfReason}
        </span>
      )}
    </button>
  </li>
);

export default StageSidebar;
