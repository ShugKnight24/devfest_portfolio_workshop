import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import ThemeSwitcher from "./ThemeSwitcher";
import DarkModeToggle from "./DarkModeToggle";

import {
  Checkmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Close,
  Eye,
  EyeClosed,
  Menu,
  Settings,
} from "./Icons";

const navIcons = {
  top: <ChevronUp />,
  bottom: <ChevronDown />,
  left: <ChevronLeft />,
  right: <ChevronRight />,
  center: <Menu />,
  hide: <EyeClosed />,
  show: <Eye />,
  menu: <Menu />,
  close: <Close />,
  settings: <Settings />,
};

// Direct standalone primary links
const directNavLinks = [
  { to: "/", label: "Home" },
  { to: "/slides", label: "Slides" },
  { to: "/agentic-studio", label: "Agentic Studio" },
];

// Grouped dropdown categories for space-saving navigation
const navGroups = [
  {
    id: "learn",
    label: "Learn",
    items: [
      { to: "/lessons", label: "Lessons", desc: "5 tracks: React, Vanilla, Vue, Svelte, AI" },
      { to: "/guide", label: "Guide", desc: "Step-by-step workshop guidebook" },
      { to: "/resources", label: "Resources", desc: "Curated tools, links & cheat sheets" },
      { to: "/whats-next", label: "What's Next", desc: "Production release & next steps" },
    ],
  },
  {
    id: "build",
    label: "Build",
    items: [
      { to: "/builder", label: "Portfolio Builder", desc: "Interactive visual portfolio editor" },
      { to: "/components", label: "Components", desc: "Modular UI variant library" },
      { to: "/demo", label: "Demo", desc: "Live preview of portfolio styles" },
    ],
  },
  {
    id: "play",
    label: "Play",
    items: [
      { to: "/challenges", label: "Challenges", desc: "Daily code quests & milestones" },
      { to: "/quiz", label: "Quiz", desc: "Test frontend & agentic fluency" },
      { to: "/achievements", label: "Achievements", desc: "Badges & workshop progression" },
      { to: "/showcase", label: "Showcase", desc: "Community portfolios & inspirations" },
    ],
  },
  {
    id: "hub",
    label: "Hub",
    items: [
      { to: "/events", label: "Events", desc: "Detroit LHM, DevFest & summit talks" },
      { to: "/dashboard", label: "Dashboard", desc: "Progress metrics & workshop stats" },
      { to: "/dashboard/telemetry", label: "Telemetry", desc: "Bot isolation & traffic telemetry" },
      { to: "/help", label: "Help & FAQ", desc: "Common issues, FAQ & setup fixes" },
    ],
  },
];

// Flat list of all links for expanded / mobile fallback
const allNavLinks = [
  ...directNavLinks,
  ...navGroups.flatMap((g) => g.items),
];

export const Navigation = () => {
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Persist position & layout preferences
  const [verticalPos, setVerticalPos] = useState(() => {
    const saved = localStorage.getItem("nav_vertical");
    return saved || "top";
  });
  const [horizontalPos, setHorizontalPos] = useState(() => {
    const saved = localStorage.getItem("nav_horizontal");
    return saved || "center";
  });
  const [displayMode, setDisplayMode] = useState(() => {
    const saved = localStorage.getItem("nav_display_mode");
    return saved || "compact"; // "compact" (space-saving grouped) or "expanded" (all links)
  });

  const [isHidden, setIsHidden] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  // Save preferences
  useEffect(() => {
    localStorage.setItem("nav_vertical", verticalPos);
  }, [verticalPos]);

  useEffect(() => {
    localStorage.setItem("nav_horizontal", horizontalPos);
  }, [horizontalPos]);

  useEffect(() => {
    localStorage.setItem("nav_display_mode", displayMode);
  }, [displayMode]);

  // Close menus on route change or outside click
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowSettings(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpenDropdown(null);
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Desktop link styles
  const linkClass = ({ isActive }) =>
    `px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono tracking-wide transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
      isActive
        ? "bg-(--color-primary) text-(--color-primary-text,white) shadow-md shadow-(--color-primary)/30"
        : "text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark)"
    }`;

  // Vertical sidebar (left/right) link styles
  const verticalLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-xs font-semibold font-mono transition-all flex items-center gap-2.5 w-full ${
      isActive
        ? "bg-(--color-primary) text-(--color-primary-text,white) shadow-md shadow-(--color-primary)/30"
        : "text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark)"
    }`;

  // Mobile drawer link styles
  const mobileLinkClass = ({ isActive }) =>
    `px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-3 w-full ${
      isActive
        ? "bg-(--color-primary) text-(--color-primary-text,white)"
        : "text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark)"
    }`;

  // Desktop positioning classes
  const getDesktopPositionClasses = () => {
    const vertical = verticalPos === "top" ? "top-3" : "bottom-3";

    if (horizontalPos === "left") {
      return `${vertical} left-3 right-auto translate-x-0 flex-col items-stretch max-h-[92vh] overflow-y-auto`;
    } else if (horizontalPos === "right") {
      return `${vertical} right-3 left-auto translate-x-0 flex-col items-stretch max-h-[92vh] overflow-y-auto`;
    }
    return `${vertical} left-1/2 -translate-x-1/2 flex-row items-center max-w-[95vw]`;
  };

  // Mobile button position
  const getMobileButtonPosition = () => {
    const vertical = verticalPos === "top" ? "top-3" : "bottom-3";
    if (horizontalPos === "left") return `${vertical} left-3`;
    if (horizontalPos === "right") return `${vertical} right-3`;
    return `${vertical} right-3`;
  };

  // Mobile drawer classes
  const getMobileDrawerClasses = () => {
    if (horizontalPos === "left") {
      return {
        panel: `fixed top-0 left-0 h-full w-72 z-60 transform transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`,
        direction: "left",
      };
    } else if (horizontalPos === "right") {
      return {
        panel: `fixed top-0 right-0 h-full w-72 z-60 transform transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`,
        direction: "right",
      };
    }
    return {
      panel: `fixed ${
        verticalPos === "top" ? "top-0" : "bottom-0"
      } left-0 right-0 z-60 transform transition-transform duration-300 ${
        isMobileMenuOpen
          ? "translate-y-0"
          : verticalPos === "top"
          ? "-translate-y-full"
          : "translate-y-full"
      }`,
      direction: "center",
    };
  };

  const isVerticalLayout =
    horizontalPos === "left" || horizontalPos === "right";
  const drawerClasses = getMobileDrawerClasses();

  // Hidden state - show minimal toggle button
  if (isHidden) {
    return (
      <button
        onClick={() => setIsHidden(false)}
        className={`fixed ${getMobileButtonPosition()} z-60 
          px-3.5 py-1.5 bg-(--color-surface)/90 dark:bg-(--color-surface-dark)/90 backdrop-blur-md rounded-full shadow-lg border border-(--color-border) dark:border-(--color-border-dark)
          text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark)
          transition-all hover:scale-105 cursor-pointer flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-500`}
        title="Show Navigation"
        aria-label="Show Navigation"
      >
        {navIcons.show}
        <span className="text-xs font-mono font-semibold">Show Nav</span>
      </button>
    );
  }

  // Settings dropdown content
  const SettingsContent = ({ onClose, isMobile = false }) => (
    <div className={isMobile ? "space-y-4" : "space-y-3"}>
      {/* Theme & Dark Mode Controls */}
      <div>
        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 px-2 py-1 uppercase tracking-wider font-mono">
          Theme & Mode
        </p>
        <div className="flex items-center gap-1.5 px-0.5">
          <ThemeSwitcher
            showLabel={true}
            menuClassName={isMobile ? "left-0 top-full mt-2" : undefined}
            buttonClassName="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          />
          <DarkModeToggle
            showLabel={true}
            buttonClassName="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          />
        </div>
      </div>

      <div className="h-px bg-gray-200 dark:bg-gray-700" />

      {/* Display Mode (Compact vs Expanded) */}
      <div>
        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 px-2 py-1 uppercase tracking-wider font-mono">
          Display Mode
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => {
              setDisplayMode("compact");
              if (!isMobile) onClose();
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              displayMode === "compact"
                ? "bg-(--color-primary) text-(--color-primary-text,white) font-bold"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Compact
          </button>
          <button
            onClick={() => {
              setDisplayMode("expanded");
              if (!isMobile) onClose();
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              displayMode === "expanded"
                ? "bg-(--color-primary) text-(--color-primary-text,white) font-bold"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            All Links
          </button>
        </div>
      </div>

      <div className="h-px bg-gray-200 dark:bg-gray-700" />

      {/* Vertical Position */}
      <div>
        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 px-2 py-1 uppercase tracking-wider font-mono">
          Vertical Position
        </p>
        <div className={isMobile ? "flex gap-2" : "space-y-1"}>
          <button
            onClick={() => {
              setVerticalPos("top");
              if (!isMobile) onClose();
            }}
            className={`${
              isMobile ? "flex-1" : "w-full"
            } px-3 py-1.5 rounded-lg text-xs ${
              isMobile ? "justify-center" : "text-left"
            } flex items-center gap-2 cursor-pointer transition-colors ${
              verticalPos === "top"
                ? "bg-(--color-primary)/20 text-gray-950 dark:text-white font-semibold"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {navIcons.top}
            Top
            {!isMobile && verticalPos === "top" && (
              <Checkmark className="w-3.5 h-3.5 ml-auto text-current" />
            )}
          </button>
          <button
            onClick={() => {
              setVerticalPos("bottom");
              if (!isMobile) onClose();
            }}
            className={`${
              isMobile ? "flex-1" : "w-full"
            } px-3 py-1.5 rounded-lg text-xs ${
              isMobile ? "justify-center" : "text-left"
            } flex items-center gap-2 cursor-pointer transition-colors ${
              verticalPos === "bottom"
                ? "bg-(--color-primary)/20 text-gray-950 dark:text-white font-semibold"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {navIcons.bottom}
            Bottom
            {!isMobile && verticalPos === "bottom" && (
              <Checkmark className="w-3.5 h-3.5 ml-auto text-current" />
            )}
          </button>
        </div>
      </div>

      <div className="h-px bg-gray-200 dark:bg-gray-700" />

      {/* Horizontal Position */}
      <div>
        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 px-2 py-1 uppercase tracking-wider font-mono">
          Horizontal Position
        </p>
        <div className={isMobile ? "flex gap-2" : "space-y-1"}>
          <button
            onClick={() => {
              setHorizontalPos("left");
              if (!isMobile) onClose();
            }}
            className={`${
              isMobile ? "flex-1" : "w-full"
            } px-3 py-1.5 rounded-lg text-xs ${
              isMobile ? "justify-center" : "text-left"
            } flex items-center gap-2 cursor-pointer transition-colors ${
              horizontalPos === "left"
                ? "bg-(--color-primary)/20 text-gray-950 dark:text-white font-semibold"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {navIcons.left}
            Left
            {!isMobile && horizontalPos === "left" && (
              <Checkmark className="w-3.5 h-3.5 ml-auto text-current" />
            )}
          </button>
          <button
            onClick={() => {
              setHorizontalPos("center");
              if (!isMobile) onClose();
            }}
            className={`${
              isMobile ? "flex-1" : "w-full"
            } px-3 py-1.5 rounded-lg text-xs ${
              isMobile ? "justify-center" : "text-left"
            } flex items-center gap-2 cursor-pointer transition-colors ${
              horizontalPos === "center"
                ? "bg-(--color-primary)/20 text-gray-950 dark:text-white font-semibold"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {navIcons.center}
            Center
            {!isMobile && horizontalPos === "center" && (
              <Checkmark className="w-3.5 h-3.5 ml-auto text-current" />
            )}
          </button>
          <button
            onClick={() => {
              setHorizontalPos("right");
              if (!isMobile) onClose();
            }}
            className={`${
              isMobile ? "flex-1" : "w-full"
            } px-3 py-1.5 rounded-lg text-xs ${
              isMobile ? "justify-center" : "text-left"
            } flex items-center gap-2 cursor-pointer transition-colors ${
              horizontalPos === "right"
                ? "bg-(--color-primary)/20 text-gray-950 dark:text-white font-semibold"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {navIcons.right}
            Right
            {!isMobile && horizontalPos === "right" && (
              <Checkmark className="w-3.5 h-3.5 ml-auto text-current" />
            )}
          </button>
        </div>
      </div>

      <div className="h-px bg-gray-200 dark:bg-gray-700" />

      {/* Hide Option */}
      <button
        onClick={() => {
          setIsHidden(true);
          onClose();
        }}
        className="w-full px-3 py-1.5 rounded-lg text-xs text-left flex items-center gap-2 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-mono"
      >
        {navIcons.hide}
        Hide Navigation
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <nav
        ref={dropdownRef}
        className={`fixed ${getDesktopPositionClasses()} z-60 
          hidden md:flex gap-1 p-1 
          bg-(--color-surface)/90 dark:bg-(--color-surface-dark)/90 backdrop-blur-xl 
          rounded-2xl shadow-xl border border-(--color-border)/80 dark:border-(--color-border-dark)/80
          transition-all duration-300`}
      >
        {/* COMPACT MODE (DEFAULT): Space-Saving Grouped Dropdowns */}
        {displayMode === "compact" && !isVerticalLayout ? (
          <>
            {/* Primary direct links */}
            {directNavLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass}>
                {link.label}
              </NavLink>
            ))}

            {/* Grouped Category Dropdowns */}
            {navGroups.map((group) => {
              const isGroupActive = group.items.some(
                (item) => item.to === location.pathname
              );
              const isOpen = openDropdown === group.id;

              return (
                <div key={group.id} className="relative">
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : group.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono tracking-wide transition-all flex items-center gap-1 cursor-pointer select-none ${
                      isGroupActive
                        ? "bg-(--color-primary)/20 text-(--color-text) dark:text-(--color-text-dark) border border-(--color-primary)/40"
                        : "text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark)"
                    }`}
                    aria-expanded={isOpen}
                  >
                    <span>{group.label}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                    {isGroupActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-(--color-primary) inline-block" />
                    )}
                  </button>

                  {/* Dropdown Menu Popover */}
                  {isOpen && (
                    <div
                      className={`absolute z-70 bg-(--color-surface)/95 dark:bg-(--color-surface-dark)/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-(--color-border) dark:border-(--color-border-dark) p-2 min-w-[240px] animate-fade-in ${
                        verticalPos === "top"
                          ? "top-full mt-2 left-0"
                          : "bottom-full mb-2 left-0"
                      }`}
                    >
                      <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                        {group.label} Section
                      </div>
                      <div className="space-y-1 pt-1">
                        {group.items.map((item) => {
                          const isItemActive = location.pathname === item.to;
                          return (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={() => setOpenDropdown(null)}
                              className={`p-2 rounded-xl text-left transition-all block group cursor-pointer ${
                                isItemActive
                                  ? "bg-(--color-primary) text-(--color-primary-text,white) shadow-sm"
                                  : "hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark) text-(--color-text) dark:text-(--color-text-dark)"
                              }`}
                            >
                              <div className="text-xs font-bold font-mono flex items-center justify-between">
                                <span>{item.label}</span>
                                {isItemActive && (
                                  <Checkmark className="w-3.5 h-3.5 text-current" />
                                )}
                              </div>
                              <p
                                className={`text-[11px] leading-tight mt-0.5 line-clamp-1 ${
                                  isItemActive
                                    ? "opacity-90 font-medium"
                                    : "text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                                }`}
                              >
                                {item.desc}
                              </p>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          /* EXPANDED MODE or VERTICAL SIDEBAR: Clean categorized structure */
          <div className={isVerticalLayout ? "space-y-3 w-full" : "flex items-center gap-1"}>
            {isVerticalLayout ? (
              <>
                <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                  Primary
                </div>
                {directNavLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} className={verticalLinkClass}>
                    {link.label}
                  </NavLink>
                ))}

                {navGroups.map((group) => (
                  <div key={group.id} className="pt-2">
                    <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                      {group.label}
                    </div>
                    <div className="space-y-0.5">
                      {group.items.map((item) => (
                        <NavLink key={item.to} to={item.to} className={verticalLinkClass}>
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              allNavLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={linkClass}>
                  {link.label}
                </NavLink>
              ))
            )}
          </div>
        )}

        {/* Divider */}
        <div
          className={
            isVerticalLayout
              ? "h-px w-full bg-(--color-border) dark:bg-(--color-border-dark) my-1"
              : "w-px h-6 bg-(--color-border) dark:bg-(--color-border-dark) mx-1"
          }
        />

        {/* Theme Switcher */}
        <ThemeSwitcher
          isVertical={isVerticalLayout}
          verticalPos={verticalPos}
          horizontalPos={horizontalPos}
          showLabel={isVerticalLayout}
          buttonClassName={`${
            isVerticalLayout ? "w-full justify-start px-3 py-2" : "p-1.5"
          } rounded-lg transition-all cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-500 text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark)`}
        />

        {/* Dark Mode Toggle */}
        <DarkModeToggle
          showLabel={isVerticalLayout}
          buttonClassName={`${
            isVerticalLayout ? "w-full justify-start px-3 py-2" : "p-1.5"
          } rounded-lg transition-all cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-500 text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark)`}
        />

        {/* Settings Button */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`${
              isVerticalLayout ? "w-full justify-start px-3 py-2" : "p-1.5"
            } rounded-lg transition-all cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-500 ${
              showSettings
                ? "bg-(--color-surface-hover) dark:bg-(--color-surface-hover-dark) text-(--color-text) dark:text-(--color-text-dark)"
                : "text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark)"
            }`}
            title="Navigation Settings"
            aria-label="Navigation Settings"
            aria-expanded={showSettings}
          >
            {navIcons.settings}
            {isVerticalLayout && <span className="text-xs font-mono font-semibold">Settings</span>}
          </button>

          {/* Settings Dropdown */}
          {showSettings && (
            <div
              className={`absolute z-70 bg-(--color-surface)/95 dark:bg-(--color-surface-dark)/95 backdrop-blur-xl rounded-xl shadow-xl border border-(--color-border) dark:border-(--color-border-dark) p-2.5 min-w-[200px]
                ${
                  isVerticalLayout
                    ? horizontalPos === "left"
                      ? "left-full ml-2 top-0"
                      : "right-full mr-2 top-0"
                    : verticalPos === "top"
                    ? "top-full mt-2 right-0"
                    : "bottom-full mb-2 right-0"
                }`}
            >
              <SettingsContent onClose={() => setShowSettings(false)} />
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`fixed ${getMobileButtonPosition()} z-70 
            p-2.5 bg-(--color-surface)/90 dark:bg-(--color-surface-dark)/90 backdrop-blur-md rounded-full shadow-lg border border-(--color-border) dark:border-(--color-border-dark)
            text-(--color-text) dark:text-(--color-text-dark) transition-all hover:scale-105 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500`}
          title={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? navIcons.close : navIcons.menu}
        </button>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu Drawer */}
        <div
          className={`${
            drawerClasses.panel
          } bg-(--color-surface)/95 dark:bg-(--color-surface-dark)/95 backdrop-blur-2xl shadow-2xl border-(--color-border) dark:border-(--color-border-dark) overflow-y-auto max-h-screen
            ${drawerClasses.direction === "left" ? "border-r" : ""}
            ${drawerClasses.direction === "right" ? "border-l" : ""}
            ${
              drawerClasses.direction === "center" && verticalPos === "top"
                ? "border-b"
                : ""
            }
            ${
              drawerClasses.direction === "center" && verticalPos === "bottom"
                ? "border-t"
                : ""
            }
          `}
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-(--color-border) dark:border-(--color-border-dark) flex items-center justify-between">
            <h2 className="font-bold font-mono text-sm uppercase tracking-wider text-(--color-text) dark:text-(--color-text-dark)">
              Workshop Navigation
            </h2>
            <div className="flex items-center gap-1">
              <ThemeSwitcher
                menuClassName="right-0 top-full mt-2"
                buttonClassName="p-2 rounded-lg text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark) focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
              />
              <DarkModeToggle
                buttonClassName="p-2 rounded-lg text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark) focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
              />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-(--color-muted-text) hover:text-(--color-text) dark:text-(--color-muted-text-dark) dark:hover:text-(--color-text-dark) rounded-lg hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark) cursor-pointer"
                aria-label="Close navigation drawer"
              >
                {navIcons.close}
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Primary Section */}
            <div>
              <div className="px-1 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                Core
              </div>
              <div className="space-y-1 pt-1">
                {directNavLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={mobileLinkClass}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Categorized Sections */}
            {navGroups.map((group) => (
              <div key={group.id} className="pt-2 border-t border-gray-100 dark:border-gray-800/80">
                <div className="px-1 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                  {group.label}
                </div>
                <div className="space-y-1 pt-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={mobileLinkClass}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-semibold">{item.label}</span>
                        <span className="text-[11px] text-gray-400 font-normal">{item.desc}</span>
                      </div>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}

            {/* Mobile Settings */}
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
              <SettingsContent
                onClose={() => setIsMobileMenuOpen(false)}
                isMobile={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close settings */}
      {showSettings && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSettings(false)}
        />
      )}
    </>
  );
};

export default Navigation;
