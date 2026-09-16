import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import ThemeSwitcher from "./ThemeSwitcher";
import DarkModeToggle from "./DarkModeToggle";
import { useShell } from "../context/ShellContext";
import { groupedRoutes, spineNeighbors } from "../config/navigation.js";

import {
  Checkmark,
  ChevronLeft,
  ChevronRight,
  Close,
  Menu,
} from "./Icons";

/*
 * Navigation — the workshop app's own chrome. One bar. Every route. Always.
 *
 * The configurable, repositionable nav this file used to grow was a teaching
 * demo about the ATTENDEE'S portfolio ("your nav can go anywhere"). It was
 * never meant to be the workshop app's own shell, and applying it here is why
 * the bar ballooned: modes, primaries, an overflow menu, a stepper, a hide
 * toggle, a separate mobile sheet, and nothing on /slides at all.
 *
 * So this bar holds three controls and nothing else:
 *
 *   Home · Search (Cmd+K) · Menu
 *
 * That is the whole invariant. The route list is not in the bar, it is in the
 * overlay behind Menu, so the bar's width is a function of three controls and
 * never of `routes.length`. A 30th route changes the overlay, not the chrome.
 *
 * The two things that used to make the chrome shift per route now live
 * elsewhere: the workshop stepper is a bottom-anchored bar on spine routes
 * only, and /slides gets the same bar in an auto-hiding presenting variant
 * rather than no bar at all.
 *
 * Modes (Stage / Workshop / Explore) are gone from the visible chrome. `mode`
 * still lives in ShellContext, the palette still sets it, and the landing page
 * still seeds it — but nothing in this file reads it. A menu button whose
 * contents depend on invisible state is the inconsistency, not the cure.
 */

/** Presenting: how long the pointer may rest before the bar gets out of the way. */
const PRESENTING_HIDE_MS = 3000;

const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Shared pill styling for the three bar controls. */
const CONTROL_CLASS =
  "px-2.5 py-1.5 rounded-[2px] text-[11px] font-mono font-bold uppercase tracking-wider " +
  "flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors " +
  "text-(--color-muted-text) dark:text-(--color-muted-text-dark) " +
  "hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark) " +
  "hover:text-(--color-text) dark:hover:text-(--color-text-dark)";

const ACTIVE_CONTROL_CLASS =
  "px-2.5 py-1.5 rounded-[2px] text-[11px] font-mono font-bold uppercase tracking-wider " +
  "flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors " +
  "bg-(--color-primary) text-(--color-primary-text,white)";

export const Navigation = () => {
  const location = useLocation();
  const { openPalette } = useShell();

  const barRef = useRef(null);
  const panelRef = useRef(null);
  const menuButtonRef = useRef(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBarVisible, setIsBarVisible] = useState(true);

  const sections = useMemo(() => groupedRoutes(), []);
  const spine = useMemo(() => spineNeighbors(location.pathname), [location.pathname]);

  /**
   * The deck owns the whole screen, but it does not get to own the app.
   *
   * Returning null here was the single biggest inconsistency: the one route a
   * speaker is standing in front of was the one route with no way back. The bar
   * renders on /slides too — parked clear of the deck's own fixed header
   * ([aria-label="Stage controls"]) and bottom HUD, below them in stacking
   * order, and fading itself out after a few still seconds.
   */
  const isPresenting = location.pathname.startsWith("/slides");

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  // Close the overlay on route change; the destination is already on screen.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  /**
   * Presenting auto-hide.
   *
   * Two hard rules: it never hides while the overlay is open, and it never
   * hides while it contains focus — a keyboard user tabbing into the bar must
   * not have it vanish under them. When either holds, the timer simply declines
   * to fire; the next pointer move or focus change schedules a fresh one.
   */
  useEffect(() => {
    if (!isPresenting) {
      setIsBarVisible(true);
      return undefined;
    }

    let timer;

    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (isMenuOpen) return;
        if (barRef.current?.contains(document.activeElement)) return;
        setIsBarVisible(false);
      }, PRESENTING_HIDE_MS);
    };

    const reveal = () => {
      setIsBarVisible(true);
      schedule();
    };

    window.addEventListener("mousemove", reveal);
    window.addEventListener("focusin", reveal);
    schedule();

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", reveal);
      window.removeEventListener("focusin", reveal);
    };
  }, [isPresenting, isMenuOpen]);

  /**
   * Overlay focus handling: move focus in on open, hand it back to the Menu
   * button on close, and let Escape close from anywhere inside.
   */
  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const opener = document.activeElement;
    panelRef.current?.querySelector("button, [href]")?.focus?.();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // The page behind a full-screen overlay must not scroll under it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      const restoreTo = menuButtonRef.current || opener;
      restoreTo?.focus?.();
    };
  }, [isMenuOpen]);

  /**
   * Keep Tab inside the overlay.
   *
   * `aria-modal` tells assistive tech the rest of the page is inert; it does
   * not stop Tab from walking out into the bar behind us.
   */
  const handlePanelKeyDown = (e) => {
    if (e.key !== "Tab") return;
    const focusable = panelRef.current?.querySelectorAll(
      'button, [href], input, [tabindex]:not([tabindex="-1"])'
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

  const overlayLinkClass = ({ isActive }) =>
    `block p-2 rounded-[2px] no-underline transition-colors ${
      isActive
        ? "bg-(--color-primary) text-(--color-primary-text,white)"
        : "text-(--color-text) dark:text-(--color-text-dark) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark)"
    }`;

  /*
   * Position is the only thing that differs between the two variants, and it
   * differs because the deck has fixed chrome at both edges: its header sits at
   * the top and its HUD at the bottom, so the bar parks above the HUD on the
   * left and drops below both in stacking order. Everything inside the bar —
   * the controls, their order, their labels, the overlay they open — is
   * identical on every route.
   *
   * The bar's max-w is belt-and-braces: it holds three fixed controls, so it
   * cannot grow with the route list even if someone tries to add a link to it.
   */
  const barPlacement = isPresenting
    ? `fixed bottom-24 left-4 z-30 transition-opacity duration-300 ${
        isBarVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`
    : "fixed top-3 left-1/2 -translate-x-1/2 z-60";

  return (
    <>
      <nav
        ref={barRef}
        id="app-bar"
        aria-label="Primary"
        className={`${barPlacement} flex items-center gap-1 p-1 max-w-[min(92vw,22rem)]
          bg-(--color-surface)/90 dark:bg-(--color-surface-dark)/90 backdrop-blur-xl
          rounded-[2px] shadow-xl border border-(--color-border) dark:border-(--color-border-dark)`}
        inert={isPresenting && !isBarVisible}
      >
        <ul className="flex items-center gap-1 list-none m-0 p-0">
          <li>
            <NavLink
              id="app-bar-home"
              to="/"
              end
              className={({ isActive }) =>
                isActive ? ACTIVE_CONTROL_CLASS : CONTROL_CLASS
              }
              title="Workshop home"
            >
              Home
            </NavLink>
          </li>

          <li>
            {/* The palette is the real navigation surface. This is its door. */}
            <button
              type="button"
              id="app-bar-search"
              onClick={openPalette}
              className={`${CONTROL_CLASS} border border-(--color-border) dark:border-(--color-border-dark) hover:border-(--color-primary)`}
              title="Search every page"
              aria-keyshortcuts="Meta+K Control+K"
            >
              <span>Search</span>
              <kbd className="font-mono not-italic opacity-70" aria-hidden="true">
                &#8984;K
              </kbd>
            </button>
          </li>

          <li>
            <button
              type="button"
              id="app-bar-menu"
              ref={menuButtonRef}
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-haspopup="dialog"
              aria-controls="app-menu"
              className={`${CONTROL_CLASS} border border-(--color-border) dark:border-(--color-border-dark) hover:border-(--color-primary)`}
              title="All pages, themes and settings"
            >
              <Menu className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Menu</span>
            </button>
          </li>
        </ul>
      </nav>

      {/*
       * The overlay is where route growth goes. It is a scrolling grid, so the
       * 30th route costs a row here and nothing in the bar.
       */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-90 flex items-start justify-center px-4 py-4 sm:py-[8vh]">
          <div
            className="absolute inset-0 bg-(--color-dark)/85 backdrop-blur-sm"
            onClick={closeMenu}
            aria-hidden="true"
          />

          <div
            ref={panelRef}
            id="app-menu"
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-menu-title"
            onKeyDown={handlePanelKeyDown}
            /* No overflow-hidden: the scrolling lives on the route grid below,
               and clipping the panel would eat the theme menu, which opens
               upward out of the footer. */
            className="relative w-full max-w-3xl max-h-full flex flex-col
              bg-(--color-surface) dark:bg-(--color-surface-dark)
              border border-(--color-border) dark:border-(--color-border-dark)
              rounded-[2px] shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-(--color-border) dark:border-(--color-border-dark)">
              <h2
                id="app-menu-title"
                className="m-0 text-xs font-mono font-bold uppercase tracking-[0.2em] text-(--color-text) dark:text-(--color-text-dark)"
              >
                All pages
              </h2>
              <button
                type="button"
                id="app-menu-close"
                onClick={closeMenu}
                className="p-1.5 rounded-[2px] cursor-pointer transition-colors text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark)"
                aria-label="Close menu"
              >
                <Close className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              id="app-menu-search"
              onClick={() => {
                closeMenu();
                openPalette();
              }}
              className="mx-4 mt-4 px-3 py-2 rounded-[2px] text-[11px] font-mono font-bold uppercase tracking-wider
                flex items-center justify-between gap-2 cursor-pointer transition-colors
                border border-(--color-border) dark:border-(--color-border-dark)
                text-(--color-muted-text) dark:text-(--color-muted-text-dark)
                hover:text-(--color-text) dark:hover:text-(--color-text-dark) hover:border-(--color-primary)"
              aria-keyshortcuts="Meta+K Control+K"
            >
              <span>Search everything</span>
              <kbd className="font-mono opacity-70" aria-hidden="true">
                &#8984;K
              </kbd>
            </button>

            <nav
              aria-label="All pages"
              className="flex-1 overflow-y-auto p-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {sections.map((group) => (
                <div key={group.section}>
                  <h3
                    id={`app-menu-section-${slug(group.section)}`}
                    className="m-0 px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-(--color-muted-text) dark:text-(--color-muted-text-dark)"
                  >
                    {group.section}
                  </h3>
                  <ul
                    aria-labelledby={`app-menu-section-${slug(group.section)}`}
                    className="list-none m-0 p-0 space-y-0.5"
                  >
                    {group.items.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          id={`app-menu-link-${slug(item.label)}`}
                          to={item.to}
                          end={item.to === "/"}
                          onClick={closeMenu}
                          className={overlayLinkClass}
                        >
                          {({ isActive }) => (
                            <>
                              <span className="text-xs font-bold font-mono flex items-center justify-between gap-2">
                                {item.label}
                                {isActive && (
                                  <Checkmark className="w-3.5 h-3.5 text-current shrink-0" />
                                )}
                              </span>
                              <span className="block text-[11px] leading-tight mt-0.5 opacity-80">
                                {item.desc}
                              </span>
                            </>
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            {/* Theme controls live here, not in the bar: they are set once. */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-(--color-border) dark:border-(--color-border-dark)">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                Appearance
              </span>
              <div className="flex items-center gap-1">
                <ThemeSwitcher
                  menuClassName="right-0 bottom-full mb-2"
                  buttonClassName="p-2 rounded-[2px] cursor-pointer transition-colors text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark)"
                />
                <DarkModeToggle
                  buttonClassName="p-2 rounded-[2px] cursor-pointer transition-colors text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark)"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/*
       * Spine stepper — bottom-anchored, and only where there is a next step.
       * It used to sit in the top bar, which meant the top chrome changed shape
       * as you walked the workshop. Down here it is additive: the bar above it
       * is the same on every route whether this exists or not.
       */}
      {spine.index !== -1 && (
        <nav
          id="workshop-spine"
          aria-label="Workshop steps"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1
            bg-(--color-surface)/90 dark:bg-(--color-surface-dark)/90 backdrop-blur-xl
            rounded-[2px] shadow-xl border border-(--color-border) dark:border-(--color-border-dark)"
        >
          <ul className="flex items-center gap-1 list-none m-0 p-0">
            <li>
              {spine.prev ? (
                <Link
                  id="workshop-spine-prev"
                  to={spine.prev.to}
                  className="flex p-1.5 rounded-[2px] transition-colors text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark)"
                  aria-label={`Previous step: ${spine.prev.label}`}
                  title={`Previous: ${spine.prev.label}`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="flex p-1.5 opacity-30" aria-hidden="true">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </span>
              )}
            </li>
            <li className="px-1 text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
              Step {spine.index + 1} of {spine.total}
            </li>
            <li>
              {spine.next ? (
                <Link
                  id="workshop-spine-next"
                  to={spine.next.to}
                  className="flex p-1.5 rounded-[2px] transition-colors text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark)"
                  aria-label={`Next step: ${spine.next.label}`}
                  title={`Next: ${spine.next.label}`}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="flex p-1.5 opacity-30" aria-hidden="true">
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              )}
            </li>
          </ul>
        </nav>
      )}
    </>
  );
};

export default Navigation;
