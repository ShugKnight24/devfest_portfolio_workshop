import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import ThemeSwitcher from "./ThemeSwitcher";
import DarkModeToggle from "./DarkModeToggle";
import { useShell } from "../context/ShellContext";
import { barSections, brandRoute, spineNeighbors } from "../config/navigation.js";

import { ChevronDown, ChevronLeft, ChevronRight, Close, Menu } from "./Icons";

/*
 * Navigation — a top bar with VISIBLE sections.
 *
 * Two earlier attempts failed in opposite directions. The first grew until it
 * held every route at once and changed shape per page. The second collapsed to
 * three controls, which kept the chrome constant but hid the whole information
 * architecture behind one anonymous "Menu" — you could not see what the app
 * contained without opening something.
 *
 * This one shows the structure and nothing more: five section headings, always
 * the same five, in the same order, on every route. Each reveals its own routes
 * on click. You can read the app's shape from the bar without opening anything,
 * and the bar's width is a function of five fixed headings, never of how many
 * routes live under them. A thirtieth route lengthens a dropdown, not the bar.
 *
 * Sections come from the registry (config/navigation.js), so adding a route is
 * still a data change. Nothing here hardcodes a link.
 *
 * Two things deliberately live outside this bar, because they were what made
 * the old chrome shift from page to page:
 *   - the workshop stepper, now bottom-anchored and only on spine routes
 *   - /slides, which gets this same bar in an auto-hiding presenting variant
 *     rather than a different bar or no bar at all
 */


const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const CONTROL =
  "px-2.5 py-1.5 rounded-[2px] text-[11px] font-mono font-bold uppercase tracking-wider " +
  "flex items-center gap-1 whitespace-nowrap cursor-pointer transition-colors " +
  "text-(--color-muted-text) dark:text-(--color-muted-text-dark) " +
  "hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark) " +
  "hover:text-(--color-text) dark:hover:text-(--color-text-dark)";

const CONTROL_ACTIVE =
  "px-2.5 py-1.5 rounded-[2px] text-[11px] font-mono font-bold uppercase tracking-wider " +
  "flex items-center gap-1 whitespace-nowrap cursor-pointer transition-colors " +
  "bg-(--color-primary) text-(--color-primary-text)";

/**
 * One route row, shared by the dropdowns and the mobile sheet.
 *
 * The description is coloured by the SAME active state as the row. It used to
 * carry a fixed muted-grey class, so on the active row it sat on the brand fill
 * at 1.08:1 in light mode and 1.80:1 in dark — invisible. The page-load audit
 * never caught it because dropdowns are closed on load.
 */
const RouteRow = ({ route, idPrefix }) => (
  <li>
    <NavLink
      id={`${idPrefix}-${slug(route.label)}`}
      to={route.to}
      end={route.to === "/"}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-[2px] no-underline transition-colors ${
          isActive
            ? "bg-(--color-primary) text-(--color-primary-text)"
            : "text-(--color-text) dark:text-(--color-text-dark) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark)"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="block text-xs font-bold">{route.label}</span>
          <span
            className={`block text-[11px] leading-snug ${
              isActive
                ? "text-(--color-primary-text)"
                : "text-(--color-muted-text) dark:text-(--color-muted-text-dark)"
            }`}
          >
            {route.desc}
          </span>
        </>
      )}
    </NavLink>
  </li>
);

export const Navigation = () => {
  const location = useLocation();
  const { openPalette } = useShell();

  const barRef = useRef(null);
  const openButtonRef = useRef(null);

  const [openSection, setOpenSection] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const sections = useMemo(() => barSections(), []);
  const brand = useMemo(() => brandRoute(), []);
  const spine = useMemo(() => spineNeighbors(location.pathname), [location.pathname]);

  const isPresenting = location.pathname.startsWith("/slides");

  const closeAll = useCallback(() => {
    setOpenSection(null);
    setIsSheetOpen(false);
  }, []);

  // Route changes close whatever is open; nothing should survive navigation.
  useEffect(() => {
    closeAll();
  }, [location.pathname, closeAll]);

  // Dismiss on outside click and on Escape, restoring focus to the opener.
  useEffect(() => {
    if (!openSection && !isSheetOpen) return undefined;
    const onPointerDown = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) closeAll();
    };
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      closeAll();
      openButtonRef.current?.focus?.();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openSection, isSheetOpen, closeAll]);

  const toggleSection = (name, event) => {
    openButtonRef.current = event.currentTarget;
    setOpenSection((prev) => (prev === name ? null : name));
    setIsSheetOpen(false);
  };

  /** Left/Right arrow walks the section headings, as a menubar should. */
  const onSectionKeyDown = (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const buttons = [...(barRef.current?.querySelectorAll("[data-section-button]") ?? [])];
    const i = buttons.indexOf(e.currentTarget);
    if (i === -1) return;
    e.preventDefault();
    const next =
      e.key === "ArrowRight"
        ? (i + 1) % buttons.length
        : (i - 1 + buttons.length) % buttons.length;
    buttons[next].focus();
  };

  const sectionHasActive = (items) => items.some((r) => r.to === location.pathname);

  /*
   * The deck owns /slides. This bar used to park at the bottom-left there, but
   * its dropdowns open downward, so they fell off the bottom of the screen — and
   * the deck already has its own header with a way back out, plus Cmd+K. A
   * second bar only competed with the slide, so on /slides it does not render.
   */
  if (isPresenting) return null;

  return (
    <>
      <nav
        ref={barRef}
        id="app-bar"
        aria-label="Primary"
        className={`fixed top-3 left-1/2 -translate-x-1/2 z-60 flex items-center gap-1 p-1 max-w-[96vw]
          bg-(--color-surface)/95 dark:bg-(--color-surface-dark)/95 backdrop-blur-xl
          rounded-[2px] shadow-xl border border-(--color-border) dark:border-(--color-border-dark)`}
      >
        <NavLink
          id="app-bar-home"
          to={brand.to}
          end
          className={({ isActive }) => (isActive ? CONTROL_ACTIVE : CONTROL)}
          title={brand.desc}
        >
          {brand.label}
        </NavLink>

        <span
          aria-hidden="true"
          className="w-px h-4 bg-(--color-border) dark:bg-(--color-border-dark) mx-0.5 shrink-0"
        />

        {/* The sections, visible. This is the whole point of the redesign. */}
        <ul className="hidden md:flex items-center gap-0.5 list-none m-0 p-0">
          {sections.map(({ section, items }) => {
            const isOpen = openSection === section;
            const panelId = `app-bar-panel-${slug(section)}`;
            return (
              <li key={section} className="relative">
                <button
                  type="button"
                  data-section-button
                  id={`app-bar-section-${slug(section)}`}
                  onClick={(e) => toggleSection(section, e)}
                  onKeyDown={onSectionKeyDown}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  aria-haspopup="true"
                  className={isOpen || sectionHasActive(items) ? CONTROL_ACTIVE : CONTROL}
                >
                  {section}
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isOpen && (
                  <div
                    id={panelId}
                    role="group"
                    aria-labelledby={`app-bar-section-${slug(section)}`}
                    className="absolute left-0 top-full mt-1 w-72 p-1 z-10
                      bg-(--color-surface) dark:bg-(--color-surface-dark)
                      border border-(--color-border) dark:border-(--color-border-dark)
                      rounded-[2px] shadow-2xl"
                  >
                    <ul className="list-none m-0 p-0 space-y-0.5">
                      {items.map((route) => (
                        <RouteRow
                          key={route.to}
                          route={route}
                          idPrefix={`nav-${slug(section)}`}
                        />
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* Narrow viewports: one sheet, but it still lists the sections. */}
        <button
          type="button"
          id="app-bar-sheet-toggle"
          className={`md:hidden ${isSheetOpen ? CONTROL_ACTIVE : CONTROL}`}
          onClick={(e) => {
            openButtonRef.current = e.currentTarget;
            setIsSheetOpen((prev) => !prev);
            setOpenSection(null);
          }}
          aria-expanded={isSheetOpen}
          aria-controls="app-bar-sheet"
        >
          {isSheetOpen ? <Close className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
          Menu
        </button>

        <span
          aria-hidden="true"
          className="w-px h-4 bg-(--color-border) dark:bg-(--color-border-dark) mx-0.5 shrink-0"
        />

        <button type="button" id="app-bar-search" onClick={openPalette} className={CONTROL}>
          Search
          <kbd
            aria-hidden="true"
            className="px-1 py-0.5 rounded-[2px] border border-(--color-border) dark:border-(--color-border-dark) font-sans text-[10px]"
          >
            &#8984;K
          </kbd>
        </button>

        <span className="hidden sm:flex items-center gap-1">
          <ThemeSwitcher />
          <DarkModeToggle />
        </span>
      </nav>

      {/* Mobile sheet: every section, every route, grouped the same way. */}
      {isSheetOpen && (
        <div
          id="app-bar-sheet"
          className="md:hidden fixed inset-x-2 top-16 z-60 max-h-[75vh] overflow-y-auto p-2
            bg-(--color-surface) dark:bg-(--color-surface-dark)
            border border-(--color-border) dark:border-(--color-border-dark)
            rounded-[2px] shadow-2xl"
        >
          {sections.map(({ section, items }) => (
            <section key={section} className="mb-3 last:mb-0">
              <h2 className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                {section}
              </h2>
              <ul className="list-none m-0 p-0 space-y-0.5">
                {items.map((route) => (
                  <RouteRow
                    key={route.to}
                    route={route}
                    idPrefix={`sheet-${slug(section)}`}
                  />
                ))}
              </ul>
            </section>
          ))}
          <div className="flex items-center gap-2 px-3 pt-2 border-t border-(--color-border) dark:border-(--color-border-dark)">
            <ThemeSwitcher />
            <DarkModeToggle />
          </div>
        </div>
      )}

      {/*
       * The workshop stepper. Bottom-anchored and only on spine routes, so the
       * top chrome stays identical whether or not you are on the guided path.
       */}
      {spine.index !== -1 && (
        <nav
          aria-label="Workshop steps"
          className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1
            bg-(--color-surface)/95 dark:bg-(--color-surface-dark)/95 backdrop-blur-xl
            rounded-[2px] shadow-xl border border-(--color-border) dark:border-(--color-border-dark)"
        >
          {spine.prev ? (
            <NavLink to={spine.prev.to} className={CONTROL} id="spine-prev">
              <ChevronLeft className="w-3 h-3" />
              {spine.prev.label}
            </NavLink>
          ) : (
            <span className="px-2.5 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider cursor-default text-(--color-muted-text) dark:text-(--color-muted-text-dark)" aria-disabled="true">Start</span>
          )}

          <span className="px-2 text-[11px] font-mono font-bold uppercase tracking-wider text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
            Step {spine.index + 1} of {spine.total}
          </span>

          {spine.next ? (
            <NavLink to={spine.next.to} className={CONTROL} id="spine-next">
              {spine.next.label}
              <ChevronRight className="w-3 h-3" />
            </NavLink>
          ) : (
            <span className="px-2.5 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider cursor-default text-(--color-muted-text) dark:text-(--color-muted-text-dark)" aria-disabled="true">Done</span>
          )}
        </nav>
      )}
    </>
  );
};

export default Navigation;
