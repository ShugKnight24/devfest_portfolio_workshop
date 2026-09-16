import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { EmojiIcon } from "@portfolio/icons/react";
import { Checkmark, Close, ChevronLeft, ChevronRight } from "../components/Icons";
import { EMBLEMS } from "../components/Icons/CharacterEmblems";
import { trackEvent } from "@portfolio/telemetry";
import { getDeck, getAllDecks, DEFAULT_DECK_ID } from "../data/slides";
import { getCharacters } from "../data/slides/characters";
import {
  RUNTIMES,
  DEFAULT_RUNTIME,
  getRuntime,
  selectSlides,
  getFlexZones,
  pacingStatus,
  formatClock,
  formatDrift,
} from "../data/slides/runtime";

/**
 * WorkshopSlides — Cinematic Multi-Deck Presentation Engine
 *
 * Dedicated decks for:
 * - Master Keynote (60 min): "The Reacher Protocol" (Detroit LHM & DevFest 2026)
 * - Lightning Strike (15 min): Rapid-fire tactical dossier
 * - Builder's Workshop Labs: Interactive all-day hands-on lab dashboard
 * - Michigan DevFest & AI Hackathon 2026: "Hackathon Velocity"
 * - Detroit Pride Summit 2026: "The REZE_BOMB System" (Archive)
 */

// Slide 1: Title Slide (Tactical Cyberpunk)
const TitleSlide = ({ slide, isActive }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] text-center transition-all duration-700 max-w-5xl mx-auto px-4 ${
      isActive ? "opacity-100 scale-100" : "opacity-0 scale-95"
    }`}
  >
    {slide.conferenceBadge && (
      <div className="stage-kicker inline-flex items-center gap-2 mb-6">
        <EmojiIcon name="mic" className="w-3.5 h-3.5" />
        {slide.conferenceBadge}
      </div>
    )}
    <div className="relative">
      <h1 className="stage-h1 stage-glitch stage-glow-text mb-4">{slide.title}</h1>
      <div
        className="absolute -inset-4 opacity-25 blur-3xl -z-10 transition-colors"
        style={{ backgroundColor: "var(--stage-accent)" }}
      />
    </div>
    <p className="stage-lead mt-2 max-w-4xl tracking-wide uppercase font-mono">
      {slide.subtitle}
    </p>
    <p className="stage-body mt-6 mx-auto">{slide.description}</p>
    <div className="mt-10 flex gap-2">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-[2px] animate-bounce"
          style={{
            backgroundColor: "var(--stage-accent)",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  </div>
);

// Slide 2: Reacher Formula Intro Slide
const ReacherIntroSlide = ({ slide, isActive }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] transition-all duration-700 max-w-5xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <div className="text-center mb-8">
      <span className="stage-kicker mb-3">THE REACHER FORMULA</span>
      <h2 className="stage-h2 mt-1 mb-3" style={{ color: "var(--stage-accent)" }}>
        {slide.title}
      </h2>
      <p className="stage-body italic mx-auto">"{slide.quote}"</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {slide.traits.map((trait, idx) => (
        <div key={idx} className="stage-card flex flex-col justify-between">
          <div>
            <div
              className="w-12 h-12 rounded-[2px] flex items-center justify-center mb-4"
              style={{
                backgroundColor: "rgb(var(--stage-accent-rgb) / 0.15)",
                color: "var(--stage-accent)",
              }}
            >
              <EmojiIcon name={trait.icon} className="w-6 h-6" />
            </div>
            <h3
              className="text-xl font-black mb-2 uppercase font-mono"
              style={{ color: "var(--stage-text)" }}
            >
              {trait.title}
            </h3>
            <p
              className="text-xs leading-relaxed mb-4"
              style={{ color: "var(--stage-text-muted)" }}
            >
              {trait.description}
            </p>
          </div>
          <div
            className="pt-3 border-t font-mono text-[11px] italic"
            style={{
              borderColor: "var(--stage-border)",
              color: "var(--stage-accent-alt)",
            }}
          >
            "{trait.reacherQuote}"
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Slide 3: Energy Slide (Token Economics & Code Block)
const EnergySlide = ({ slide, isActive }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] transition-all duration-700 max-w-5xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center w-full">
      <div>
        <span className="stage-kicker mb-3">
          {slide.subtitle || "PHASE 01 // TOKEN ECONOMICS"}
        </span>
        <h2 className="stage-h2 mb-4" style={{ color: "var(--stage-accent)" }}>
          {slide.title}
        </h2>
        <p className="stage-body mb-4">{slide.description}</p>
        {slide.videoUrl && (
          <a
            href={slide.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="stage-btn no-underline inline-flex items-center gap-2 cursor-pointer"
          >
            <EmojiIcon name="play" className="w-3.5 h-3.5 fill-current" />
            Watch Steve Ballmer "Developers!" Clip
            <span aria-hidden="true">
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </a>
        )}
      </div>

      {/* Code Terminal */}
      <div
        className="w-full rounded-[2px] overflow-hidden border"
        style={{
          backgroundColor: "var(--stage-surface)",
          borderColor: "var(--stage-border)",
          borderLeftStyle: "solid",
          borderLeftWidth: "var(--stage-rule)",
          borderLeftColor: "var(--stage-accent)",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{
            backgroundColor: "var(--stage-surface-raised)",
            borderColor: "var(--stage-border)",
          }}
        >
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: "var(--stage-danger)" }} />
            <div className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: "var(--stage-accent-alt)" }} />
            <div className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: "var(--stage-ok)" }} />
          </div>
          <span
            className="font-mono font-semibold"
            style={{ color: "var(--stage-text)", fontSize: "var(--stage-fs-kicker)" }}
          >
            protocol.js
          </span>
        </div>
        <pre
          className="p-5 font-mono overflow-x-auto leading-relaxed"
          style={{ fontSize: "var(--stage-fs-code)", color: "var(--stage-text)" }}
        >
          <code>
            {slide.content.split("\n").map((line, i) => {
              const isComment = line.trim().startsWith("//") || line.trim().startsWith("/*");
              const isKeyword = line.includes("const ") || line.includes("function ") || line.includes("return ");
              return (
                <div key={i} className="leading-6">
                  {isComment ? (
                    <span className="italic font-medium" style={{ color: "var(--stage-text-muted)" }}>
                      {line}
                    </span>
                  ) : isKeyword ? (
                    <span style={{ color: "var(--stage-accent)" }}>{line}</span>
                  ) : (
                    <span>{line}</span>
                  )}
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  </div>
);

// Slide 4: Zero-Bloat Doctrine Slide
const ZeroBloatSlide = ({ slide, isActive }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] transition-all duration-700 max-w-5xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">
      {/* Left Column: Photo Drop Zone */}
      <div
        className="rounded-[2px] border-2 border-dashed flex flex-col items-center justify-center p-8 min-h-[340px] relative overflow-hidden text-center transition-all"
        style={{
          backgroundColor: "var(--stage-surface)",
          borderColor: "var(--stage-border-strong)",
        }}
      >
        {slide.image ? (
          <img
            src={slide.image}
            alt="Zero Bloat Visual"
            className="absolute inset-0 w-full h-full object-cover grayscale-20"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        <div
          className="z-10 flex flex-col items-center gap-3 font-mono text-xs uppercase tracking-wider font-semibold"
          style={{ color: "var(--stage-text)" }}
        >
          <EmojiIcon name="camera" className="w-8 h-8 opacity-80" />
          <span>{slide.photoZoneText || "[ DROP DEADLIFT / TECH PHOTO HERE ]"}</span>
          <span className="text-[10px] font-medium" style={{ color: "var(--stage-text-muted)" }}>
            Sovereign Physical Rigor &bull; Lean Architecture
          </span>
        </div>
      </div>

      {/* Right Column: Zero Bloat Narrative */}
      <div>
        <span className="stage-kicker mb-3">
          {slide.subtitle || "PHASE 02 // ARCHITECTURE"}
        </span>
        <h2 className="stage-h2 mb-4" style={{ color: "var(--stage-accent)" }}>
          {slide.title}
        </h2>
        <blockquote className="stage-lead italic mb-4 font-mono">
          "{slide.quote}"
        </blockquote>
        <p className="stage-body">{slide.description}</p>
      </div>
    </div>
  </div>
);

// Slide 5: System Warning / Reze Override Trigger Slide
const SystemWarningSlide = ({ slide, isActive, isRezeMode, onToggleReze }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] text-center transition-all duration-700 max-w-4xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <div
      className="stage-card p-10 md:p-14 w-full transition-all"
      style={{
        borderColor: "var(--stage-accent-alt)",
        borderLeftColor: "var(--stage-accent-alt)",
        boxShadow: "var(--stage-glow-lg)",
      }}
    >
      <span
        className="stage-kicker mb-4"
        style={{
          color: "var(--stage-accent-alt)",
          borderColor: "var(--stage-accent-alt)",
          backgroundColor: "rgb(var(--stage-accent-alt-rgb) / 0.12)",
        }}
      >
        {slide.subtitle || "SYSTEM WARNING // VELOCITY CEILING"}
      </span>
      <h2 className="stage-h2 stage-glitch mb-4">{slide.title}</h2>
      <p className="stage-body mx-auto mb-8">{slide.description}</p>

      {/* Interactive Trigger Button right inside the slide */}
      <button
        type="button"
        onClick={onToggleReze}
        aria-pressed={isRezeMode}
        className="stage-btn px-8 py-4 text-sm hover:scale-105 active:scale-95"
      >
        {isRezeMode
          ? "[ REZE OVERRIDE ENGAGED — SYSTEM RUNNING AT MAX VELOCITY ]"
          : "[ CLICK TO ENGAGE REZE OVERRIDE PROTOCOL ]"}
      </button>

      <p
        className="mt-4 font-mono text-xs font-semibold uppercase"
        style={{ color: "var(--stage-text-muted)" }}
      >
        {isRezeMode
          ? "Explosive Chainsaw Man execution mode active"
          : slide.triggerPrompt || ">> SPEAKER: INITIATE REZE OVERRIDE (TOP RIGHT) <<"}
      </p>
    </div>
  </div>
);

// Slide 6: Paradigm Shift Slide (Audience of One)
const ParadigmSlide = ({ slide, isActive }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] transition-all duration-700 max-w-5xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <div className="text-center mb-8">
      <span className="stage-kicker mb-3">
        {slide.subtitle || "PARADIGM SHIFT // EXECUTE"}
      </span>
      <h2 className="stage-h2 mb-2" style={{ color: "var(--stage-accent)" }}>
        {slide.title}
      </h2>
      <p className="stage-body mx-auto">
        {slide.description || "Traditional advice: spend weeks polishing a static resume. Burn the resume. Build bespoke software to eliminate your own acute daily friction."}
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {slide.steps.map((st, i) => (
        <div key={i} className="stage-card flex flex-col justify-between">
          <div>
            <span
              className="text-3xl font-black font-mono mb-2 block"
              style={{ color: "var(--stage-accent-alt)" }}
            >
              {st.step}
            </span>
            <h4
              className="text-xl font-bold mb-2 uppercase font-mono"
              style={{ color: "var(--stage-text)" }}
            >
              {st.label}
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: "var(--stage-text-muted)" }}>
              {st.desc}
            </p>
          </div>
          <div
            className="mt-4 pt-3 border-t text-[10px] font-mono font-semibold uppercase"
            style={{ borderColor: "var(--stage-border)", color: "var(--stage-text-dim)" }}
          >
            Evolution Stage {st.step}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Slide 7: Case Studies Slide (Production Scale)
const CaseStudiesSlide = ({ slide, isActive }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] transition-all duration-700 max-w-5xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <div className="text-center mb-8">
      <span className="stage-kicker mb-3">
        {slide.subtitle || "PROOF OF WORK // PRODUCTION SCALE"}
      </span>
      <h2 className="stage-h2 mb-2" style={{ color: "var(--stage-accent)" }}>
        {slide.title}
      </h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {slide.items.map((item, idx) => (
        <div key={idx} className="stage-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-[2px] uppercase tracking-wider"
                style={{
                  backgroundColor: "rgb(var(--stage-accent-rgb) / 0.15)",
                  color: "var(--stage-accent)",
                }}
              >
                {item.category}
              </span>
              <div
                className="w-8 h-8 rounded-[2px] flex items-center justify-center"
                style={{
                  backgroundColor: "rgb(var(--stage-accent-rgb) / 0.15)",
                  color: "var(--stage-accent)",
                }}
              >
                <EmojiIcon name={item.icon || "box"} className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-3 font-mono" style={{ color: "var(--stage-text)" }}>
              {item.title}
            </h3>
            <div className="space-y-2 text-xs">
              <p style={{ color: "var(--stage-text-muted)" }}>
                <strong className="font-mono" style={{ color: "var(--stage-danger)" }}>
                  Friction:
                </strong>{" "}
                {item.problem}
              </p>
              <p style={{ color: "var(--stage-text-muted)" }}>
                <strong className="font-mono" style={{ color: "var(--stage-accent)" }}>
                  Solution:
                </strong>{" "}
                {item.solution}
              </p>
            </div>
          </div>
          <div
            className="mt-4 pt-3 border-t text-xs font-semibold font-mono"
            style={{ borderColor: "var(--stage-border)", color: "var(--stage-text-muted)" }}
          >
            Impact: {item.impact}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Slide 8: Process Slide (Agentic Dev Loop CI Gate)
const ProcessSlide = ({ slide, isActive }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] transition-all duration-700 max-w-5xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <div className="text-center mb-8">
      <span className="stage-kicker mb-3">
        {slide.subtitle || "ARCHITECTURE // CI GATE"}
      </span>
      <h2 className="stage-h2 mb-2" style={{ color: "var(--stage-accent)" }}>
        {slide.title}
      </h2>
      {slide.quote && <p className="stage-body italic mx-auto">"{slide.quote}"</p>}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {slide.stages.map((st, i) => (
        <div
          key={i}
          className="stage-card flex flex-col justify-between"
          style={{
            borderTopStyle: "solid",
            borderTopWidth: "var(--stage-rule)",
            borderTopColor: "var(--stage-accent)",
          }}
        >
          <div>
            <span
              className="text-2xl font-black font-mono mb-2 block"
              style={{ color: "var(--stage-accent-alt)" }}
            >
              {st.num}
            </span>
            <h4
              className="text-lg font-bold mb-2 uppercase font-mono"
              style={{ color: "var(--stage-text)" }}
            >
              {st.name}
            </h4>
            <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--stage-text-muted)" }}>
              {st.detail}
            </p>
          </div>
          <div
            className="pt-3 border-t flex justify-between items-center"
            style={{ borderColor: "var(--stage-border)" }}
          >
            <span
              className="text-[10px] font-mono font-semibold uppercase"
              style={{ color: "var(--stage-text-muted)" }}
            >
              Protocol Rule
            </span>
            <span className="text-xs font-mono font-bold" style={{ color: "var(--stage-accent)" }}>
              {st.rule}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Slide 9: Bio Slide (Admin Clearance Profile)
const BioSlide = ({ slide, isActive }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] transition-all duration-700 max-w-5xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <div className="w-full grid md:grid-cols-2 gap-8 items-center">
      {/* Left Details */}
      <div className="stage-card p-8 flex flex-col justify-between">
        <div>
          <span className="stage-kicker mb-3">
            {slide.title || "CLEARANCE LEVEL: ADMIN"}
          </span>
          <h3
            className="stage-h2 mb-1"
            style={{ color: "var(--stage-accent)" }}
          >
            {slide.name}
          </h3>
          <p className="text-xs font-mono mb-6" style={{ color: "var(--stage-text-muted)" }}>
            {slide.role}
          </p>
          <ul className="space-y-3 list-none p-0">
            {slide.details.map((d, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-xs leading-relaxed"
                style={{ color: "var(--stage-text-muted)" }}
              >
                <span className="font-bold shrink-0" style={{ color: "var(--stage-accent)" }}>
                  &rarr;
                </span>{" "}
                {d}
              </li>
            ))}
          </ul>
        </div>
        {slide.jackpot && (
          <div
            className="mt-6 pt-4 border-t font-mono text-sm font-bold text-center"
            style={{
              borderColor: "var(--stage-border)",
              color: "var(--stage-accent-alt)",
            }}
          >
            {slide.jackpot}
          </div>
        )}
      </div>

      {/* Right Photo Zone */}
      <div
        className="p-4 rounded-[2px] border-2 border-dashed flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden text-center"
        style={{
          backgroundColor: "var(--stage-surface)",
          borderColor: "var(--stage-border-strong)",
        }}
      >
        <img
          src={slide.image || "/assets/images/shug_headshot.jpg"}
          alt={slide.name}
          className="w-full h-full max-h-[360px] object-cover rounded-[2px] grayscale-10 hover:grayscale-0 transition-all duration-500"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div
          className="z-10 flex flex-col items-center gap-2 font-mono text-xs uppercase tracking-wider font-semibold mt-3"
          style={{ color: "var(--stage-text)" }}
        >
          <EmojiIcon name="camera" className="w-5 h-5 opacity-80" />
          <span>{slide.photoZoneText || "[ DROP PORTRAIT PHOTO HERE ]"}</span>
        </div>
      </div>
    </div>
  </div>
);

// Slide 10: Workshop Lab Slide (Interactive Hands-on Lab)
const LabSlide = ({ slide, isActive }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] transition-all duration-700 max-w-5xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <div className="w-full">
      <span className="stage-kicker mb-3">
        {slide.badge || `LAB ${slide.labNumber} // INITIATE`}
      </span>
      <h2 className="stage-h2 mb-3" style={{ color: "var(--stage-accent)" }}>
        {slide.title}
      </h2>
      <p className="stage-body mb-6">{slide.description}</p>

      {/* Lab Terminal Box */}
      <div className="stage-card p-6 md:p-8">
        <p
          className="font-bold font-mono text-sm mb-4"
          style={{ color: "var(--stage-text)" }}
        >
          Objective: {slide.objective}
        </p>
        <div
          className="p-4 rounded-[2px] font-mono border space-y-2"
          style={{
            backgroundColor: "var(--stage-bg-deep)",
            borderColor: "var(--stage-border)",
            color: "var(--stage-accent)",
            fontSize: "var(--stage-fs-code)",
          }}
        >
          {slide.terminalLines.map((line, i) => (
            <div key={i} className="leading-relaxed">
              {line}
            </div>
          ))}
        </div>
      </div>

      {slide.actionLink && (
        <div className="mt-8 flex justify-end">
          <Link
            to={slide.actionLink}
            className="stage-btn no-underline inline-flex items-center gap-2 cursor-pointer"
          >
            <EmojiIcon name="tools" className="w-4 h-4" />
            {slide.actionLabel || "Launch Tool"}
            <span aria-hidden="true">
              <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      )}
    </div>
  </div>
);

// Retained Slide Components for DevFest/Pride Compatibility
const PollSlide = ({ slide, isActive }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] transition-all duration-700 w-full max-w-4xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <h2 className="stage-h2 mb-4 text-center" style={{ color: "var(--stage-accent)" }}>
      {slide.title}
    </h2>
    <p className="stage-body mb-8 text-center mx-auto">{slide.subtitle}</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {slide.polls?.map((poll) => (
        <div key={poll.id} className="stage-card">
          <h4 className="text-base font-bold mb-2" style={{ color: "var(--stage-text)" }}>
            {poll.question}
          </h4>
          <p className="text-xs italic" style={{ color: "var(--stage-accent)" }}>
            {poll.followUp}
          </p>
        </div>
      ))}
    </div>
  </div>
);

const QuoteSlide = ({ slide, isActive }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] transition-all duration-700 max-w-4xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <h2 className="stage-h2 mb-8 text-center">{slide.title}</h2>
    {slide.quotes?.[0] && (
      <blockquote className="stage-lead italic mb-4 text-center" style={{ color: "var(--stage-accent)" }}>
        "{slide.quotes[0].text}"
      </blockquote>
    )}
  </div>
);

const LaunchSlide = ({ slide, isActive }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] text-center transition-all duration-700 max-w-3xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <h2 className="stage-h1 mb-4">{slide.title}</h2>
    <p className="stage-body mb-8 mx-auto">{slide.subtitle}</p>
    <Link
      to={slide.ctaLink || "/guide"}
      className="stage-btn no-underline cursor-pointer inline-flex items-center gap-2"
    >
      {slide.ctaText || "Open Starter Guide"}
      <span aria-hidden="true">
        <ChevronRight className="w-4 h-4" />
      </span>
    </Link>
  </div>
);

// Slide: Statement (Massive bold typography, phase badge, narrative text)
const StatementSlide = ({ slide, isActive }) => {
  const isCentered = slide.center ?? false;

  return (
    <div
      className={`flex flex-col ${
        isCentered ? "items-center text-center" : "items-start text-left"
      } justify-center min-h-[70vh] transition-all duration-700 max-w-5xl mx-auto px-4 ${
        isActive ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
    >
      {slide.phase && (
        <div className="stage-kicker inline-flex items-center gap-2 mb-6">
          {slide.phase}
        </div>
      )}

      <div className="relative w-full">
        <h1
          className="stage-h1 stage-glow-text mb-6 whitespace-pre-line"
          style={{ color: "var(--stage-text)" }}
        >
          {slide.title}
        </h1>
        <div
          className="absolute -inset-4 opacity-20 blur-3xl -z-10 transition-colors pointer-events-none"
          style={{ backgroundColor: "var(--stage-accent)" }}
        />
      </div>

      <p className="stage-lead mt-2" style={{ color: "var(--stage-text-muted)", fontWeight: 400 }}>
        {slide.description}
      </p>

      {slide.signature && (
        <div
          className="mt-10 p-4 rounded-[2px] border font-mono text-sm tracking-wide"
          style={{
            backgroundColor: "var(--stage-surface)",
            borderColor: "var(--stage-border)",
          }}
        >
          <div
            className="whitespace-pre-line leading-relaxed font-semibold"
            style={{ color: "var(--stage-text)" }}
          >
            {slide.signature}
          </div>
        </div>
      )}
    </div>
  );
};

// Slide: Comparison (Split-screen 2-column contrast for Prompts, Code Execution, and Squad Characters)
const ComparisonSlide = ({ slide, isActive }) => {
  const cards = slide.columns || [
    slide.bad && { ...slide.bad, type: "bad" },
    slide.good && { ...slide.good, type: "good" },
  ].filter(Boolean);

  return (
    <div
      className={`flex flex-col justify-center min-h-[70vh] transition-all duration-700 max-w-6xl mx-auto px-4 ${
        isActive ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
    >
      {/* Header Info */}
      <div className="mb-8">
        {slide.phase && (
          <div className="stage-kicker inline-flex items-center gap-2 mb-3">
            {slide.phase}
          </div>
        )}
        <h2 className="stage-h2">{slide.title}</h2>
        {slide.description && <p className="stage-body mt-2">{slide.description}</p>}
      </div>

      {/* 2-Column Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {cards.map((card, idx) => {
          const isBad = card.type === "bad";
          const isGood = card.type === "good";

          return (
            <div
              key={idx}
              className="stage-card flex flex-col justify-between"
              style={{
                borderTopStyle: "solid",
                borderTopWidth: "var(--stage-rule)",
                borderTopColor: isBad ? "var(--stage-danger)" : "var(--stage-accent)",
                borderLeftColor: isBad ? "var(--stage-danger)" : "var(--stage-accent)",
                boxShadow: isGood ? "var(--stage-glow-md)" : undefined,
              }}
            >
              <div>
                {/* Character Header */}
                {card.character && (
                  <div
                    className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider mb-2"
                    style={{ color: "var(--stage-accent-alt)" }}
                  >
                    {card.character}
                  </div>
                )}

                {/* Narrative / Description */}
                {card.narrative && (
                  <p
                    className="text-xs md:text-sm leading-relaxed mb-4"
                    style={{ color: "var(--stage-text-muted)" }}
                  >
                    {card.narrative}
                  </p>
                )}

                {/* Tag Badge */}
                {card.tag && (
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] font-mono text-xs font-bold uppercase mb-3 border"
                    style={{
                      backgroundColor: isBad
                        ? "color-mix(in srgb, var(--stage-danger) 18%, transparent)"
                        : "rgb(var(--stage-accent-rgb) / 0.12)",
                      borderColor: isBad ? "var(--stage-danger)" : "var(--stage-border-strong)",
                      color: isBad ? "var(--stage-danger)" : "var(--stage-accent)",
                    }}
                  >
                    {card.tag}
                  </div>
                )}

                {/* Content Box or BoxContent */}
                {(card.content || card.boxContent) && (
                  <div
                    className="p-4 rounded-[2px] border font-mono text-xs md:text-sm leading-relaxed whitespace-pre-wrap overflow-x-auto"
                    style={{
                      backgroundColor: "var(--stage-bg-deep)",
                      borderColor: isBad
                        ? "color-mix(in srgb, var(--stage-danger) 40%, transparent)"
                        : "var(--stage-border)",
                      color: "var(--stage-text)",
                    }}
                  >
                    {card.content || card.boxContent}
                  </div>
                )}
              </div>

              {/* Result Footer */}
              {card.result && (
                <p
                  className="mt-4 text-xs font-mono italic"
                  style={{ color: isBad ? "var(--stage-danger)" : "var(--stage-accent)" }}
                >
                  {card.result}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Slide: Live Build — the interactive spine of the talk.
 *
 * Used for the three live beats: THE ASK (room names a friction), LAUNCH (the
 * agent starts), and PAYOFF (read the result together). Carries a speaker cue
 * that is deliberately loud on screen, because under stage lights you will not
 * read a subtitle. Prompts are the questions you throw at the room.
 */
const LiveBuildSlide = ({ slide, isActive, onOpenZone }) => (
  <div
    className={`flex flex-col justify-center min-h-[70vh] w-full max-w-5xl mx-auto px-4 transition-all duration-700 ${
      isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    }`}
  >
    {slide.phase && <span className="stage-kicker mb-6 self-start">{slide.phase}</span>}

    <h2 className="stage-h1 mb-4">{slide.title}</h2>
    {slide.subtitle && <p className="stage-lead mb-6">{slide.subtitle}</p>}
    {slide.description && <p className="stage-body mb-8">{slide.description}</p>}

    {slide.prompts?.length > 0 && (
      <ul className="grid gap-3 sm:grid-cols-3 w-full mb-8 list-none p-0">
        {slide.prompts.map((prompt, idx) => (
          <li key={prompt} className="stage-card flex gap-3 items-start">
            <span
              className="font-mono font-bold shrink-0"
              style={{ color: "var(--stage-accent)", fontSize: "var(--stage-fs-kicker)" }}
            >
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span style={{ fontSize: "var(--stage-fs-body)", color: "var(--stage-text)" }}>
              {prompt}
            </span>
          </li>
        ))}
      </ul>
    )}

    <div className="flex flex-wrap items-center gap-4">
      {slide.ctaLink && (
        <Link to={slide.ctaLink} className="stage-btn no-underline">
          {slide.ctaText || "Open"}
        </Link>
      )}
      {slide.opensZone && (
        <button
          type="button"
          id={`open-zone-${slide.id}`}
          onClick={() => onOpenZone?.(slide.opensZone)}
          className="stage-btn"
        >
          Open flex zone (Z)
        </button>
      )}
    </div>

    {/* Speaker-only cue. Hidden from the projected read but loud for the presenter. */}
    {slide.speakerCue && (
      <p
        className="mt-10 font-mono font-bold tracking-widest uppercase"
        style={{ color: "var(--stage-accent-alt)", fontSize: "var(--stage-fs-kicker)" }}
      >
        {slide.speakerCue}
      </p>
    )}
  </div>
);

/**
 * Slide: Character Roster — the side cast, one engineering lesson each.
 *
 * Two shapes, one component:
 *   - a crew grid (up to six cards: "The 110th", "Division 4")
 *   - a single-character focus card with a parable above it (Chesterton's Fence)
 *
 * Column count follows the roster size so a one-card slide reads as a statement
 * and a six-card slide still clears a projector at the back of the room. Cards
 * prefer the owner's licensed artwork when `image` is set and fall back to the
 * abstract emblem otherwise, so the deck never renders a broken slot.
 */
const CharacterRosterSlide = ({ slide, isActive }) => {
  const roster = getCharacters(slide.characters || []);
  const dense = roster.length > 2;
  const focus = roster.length === 1;
  const columns =
    focus
      ? "grid-cols-1"
      : roster.length === 2
        ? "grid-cols-1 md:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section
      className={`flex flex-col justify-center min-h-[70vh] w-full max-w-6xl mx-auto px-4 transition-all duration-700 ${
        isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      aria-labelledby={`roster-title-${slide.id}`}
    >
      {/* A six-up grid has to buy its header space back, so the dense variant
          runs title and framing side by side instead of stacked. */}
      <header
        className={
          dense
            ? "mb-4 grid gap-x-8 gap-y-1 lg:grid-cols-2 lg:items-end"
            : "mb-8"
        }
      >
        <div>
          {slide.phase && (
            <span className={`stage-kicker inline-block ${dense ? "mb-2" : "mb-4"}`}>
              {slide.phase}
            </span>
          )}
          <h2
            id={`roster-title-${slide.id}`}
            className="stage-h2 mb-2"
            style={dense ? { fontSize: "calc(var(--stage-fs-h2) * 0.78)" } : undefined}
          >
            {slide.title}
          </h2>
          {slide.subtitle && <p className={`stage-lead ${dense ? "" : "mb-4"}`}>{slide.subtitle}</p>}
        </div>

        {slide.lede && (
          <blockquote
            className="pl-6 mt-5 mb-6 max-w-5xl"
            style={{ borderLeft: "var(--stage-rule) solid var(--stage-accent-alt)" }}
          >
            <p
              className="italic"
              style={{
                fontSize: "var(--stage-fs-lead)",
                lineHeight: 1.35,
                color: "var(--stage-text)",
                textWrap: "pretty",
              }}
            >
              {slide.lede}
            </p>
          </blockquote>
        )}

        {!focus && slide.description && (
          <p className="stage-body max-w-4xl">{slide.description}</p>
        )}
      </header>

      {/* A focus slide already spent its height on the parable, so the
          application text sits beside the card rather than above it. */}
      <div
        className={
          focus
            ? "grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start"
            : "contents"
        }
      >
        {focus && slide.description && (
          <p
            className="stage-body"
            style={{ fontSize: "calc(var(--stage-fs-body) * 0.92)", lineHeight: 1.5, maxWidth: "none" }}
          >
            {slide.description}
          </p>
        )}

      <ul className={`grid ${columns} ${dense ? "gap-3" : "gap-5"} w-full list-none p-0 m-0`}>
        {roster.map((character) => {
          const Emblem = EMBLEMS[character.emblem];
          const nameId = `roster-${slide.id}-${character.id}`;

          return (
            <li
              key={character.id}
              className={`stage-card flex flex-col ${dense ? "gap-1.5" : "gap-3"}`}
              style={dense ? { padding: "var(--stage-gap-sm)" } : undefined}
              aria-labelledby={nameId}
            >
              <div className="flex items-center gap-3">
                <span
                  className="shrink-0 flex items-center justify-center overflow-hidden"
                  style={{
                    width: dense ? "2.5rem" : "3.5rem",
                    height: dense ? "2.5rem" : "3.5rem",
                    borderRadius: "var(--stage-radius)",
                    backgroundColor: "rgb(var(--stage-accent-rgb) / 0.12)",
                    border: "var(--stage-hairline) solid var(--stage-border-strong)",
                    color: "var(--stage-accent)",
                  }}
                >
                  {character.image ? (
                    <img
                      src={character.image}
                      alt={`${character.name} — ${character.role}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    Emblem && <Emblem className={dense ? "w-6 h-6" : "w-8 h-8"} />
                  )}
                </span>

                <div className="min-w-0">
                  <h3
                    id={nameId}
                    className="font-mono font-black uppercase tracking-tight"
                    style={{
                      fontSize: dense ? "var(--stage-fs-body)" : "var(--stage-fs-lead)",
                      lineHeight: 1.1,
                      color: "var(--stage-text)",
                    }}
                  >
                    {character.name}
                  </h3>
                  <p
                    className="font-mono font-bold uppercase tracking-widest mt-1"
                    style={{
                      fontSize: "var(--stage-fs-kicker)",
                      color: "var(--stage-accent)",
                    }}
                  >
                    {character.role}
                  </p>
                </div>
              </div>

              <p
                className="italic"
                style={{
                  fontSize: "var(--stage-fs-kicker)",
                  lineHeight: 1.35,
                  color: "var(--stage-text-dim)",
                }}
              >
                {character.trait}
              </p>

              {/* The lesson is the payload. It stays the biggest thing on the
                  card, but a six-up grid has to clear 1080p without scrolling,
                  so the dense variant steps down off the body ramp. */}
              <p
                className={`mt-auto ${dense ? "pt-2" : "pt-3"}`}
                style={{
                  borderTop: "var(--stage-hairline) solid var(--stage-border)",
                  fontSize: dense
                    ? "calc(var(--stage-fs-body) * 0.78)"
                    : "var(--stage-fs-body)",
                  lineHeight: 1.35,
                  color: "var(--stage-text)",
                  textWrap: "pretty",
                }}
              >
                {character.lesson}
              </p>
            </li>
          );
        })}
      </ul>
      </div>

    </section>
  );
};

const SlideComponents = {
  title: TitleSlide,
  "character-roster": CharacterRosterSlide,
  statement: StatementSlide,
  comparison: ComparisonSlide,
  "live-build": LiveBuildSlide,
  "reacher-intro": ReacherIntroSlide,
  energy: EnergySlide,
  "zero-bloat": ZeroBloatSlide,
  "system-warning": SystemWarningSlide,
  paradigm: ParadigmSlide,
  "case-studies": CaseStudiesSlide,
  process: ProcessSlide,
  bio: BioSlide,
  lab: LabSlide,
  poll: PollSlide,
  quote: QuoteSlide,
  launch: LaunchSlide,
};

// Integrated Deck Directory & Switcher Modal
const DeckDirectoryModal = ({ isOpen, onClose, activeDeckId, onSelectDeck, allDecks }) => {
  if (!isOpen) return null;

  // Two decks you would actually stand up and give, then the source material.
  // The old four-category split presented nine equal options, which is a
  // reading exercise you do not want with the lights in your eyes.
  const categories = [
    {
      name: "Live — decks you present",
      decks: allDecks.filter((d) => !d.shelf).map((d) => d.id),
    },
    {
      name: "Shelf — source material & archives",
      decks: allDecks.filter((d) => d.shelf).map((d) => d.id),
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Slide Deck Directory"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-8 font-sans"
      onClick={onClose}
    >
      <div
        className="border-2 rounded-[2px] max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.9)]"
        style={{
          backgroundColor: "var(--stage-surface)",
          borderColor: "var(--stage-border)",
          color: "var(--stage-text)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between border-b pb-4"
          style={{ borderColor: "var(--stage-border)" }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="stage-kicker">Elastic Keynote</span>
              <span className="text-xs font-mono" style={{ color: "var(--stage-text-muted)" }}>
                {allDecks.filter((d) => !d.shelf).length} live &bull; {allDecks.filter((d) => d.shelf).length} shelved
              </span>
            </div>
            <h2
              className="text-2xl font-black uppercase font-mono mt-1"
              style={{ color: "var(--stage-text)" }}
            >
              Slide Deck &amp; Keynote Hub
            </h2>
            <p className="text-xs font-mono mt-1" style={{ color: "var(--stage-text-muted)" }}>
              Length is set by runtime (1-4), not by deck &bull; [D] toggles this directory &bull; [Esc] closes
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Deck Directory"
            className="stage-btn"
          >
            [ ESC ]
          </button>
        </div>

        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat.name} className="space-y-3">
              <h3
                className="text-xs font-mono uppercase tracking-widest font-bold"
                style={{ color: "var(--stage-accent)" }}
              >
                // {cat.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {cat.decks.map((id) => {
                  const deckMeta = allDecks.find((d) => d.id === id);
                  if (!deckMeta) return null;
                  const isCurrent =
                    activeDeckId === id ||
                    (id === "combined" && (activeDeckId === "keynote" || activeDeckId === "master" || activeDeckId === "unified")) ||
                    (id === "nomad" && activeDeckId === "reacher") ||
                    (id === "ripcord" && activeDeckId === "chainsaw");

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        onSelectDeck(id);
                        onClose();
                      }}
                      className="text-left p-4 rounded-[2px] border transition-all cursor-pointer flex flex-col justify-between space-y-3"
                      style={{
                        backgroundColor: isCurrent
                          ? "var(--stage-surface-raised)"
                          : "var(--stage-bg)",
                        borderColor: isCurrent
                          ? "var(--stage-accent)"
                          : "var(--stage-border)",
                        boxShadow: isCurrent ? "var(--stage-glow-md)" : undefined,
                      }}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] font-bold uppercase"
                            style={{
                              backgroundColor: isCurrent
                                ? "var(--stage-accent)"
                                : "rgb(var(--stage-accent-rgb) / 0.1)",
                              color: isCurrent
                                ? "var(--stage-on-accent)"
                                : "var(--stage-text-muted)",
                            }}
                          >
                            {deckMeta.duration || "Deck"}
                          </span>
                          {isCurrent && (
                            <span
                              className="text-[10px] font-mono font-bold"
                              style={{ color: "var(--stage-accent)" }}
                            >
                              ● ACTIVE
                            </span>
                          )}
                        </div>
                        <div
                          className="font-bold text-sm font-mono leading-snug"
                          style={{ color: "var(--stage-text)" }}
                        >
                          {deckMeta.title}
                        </div>
                        <div
                          className="text-xs line-clamp-2"
                          style={{ color: "var(--stage-text-muted)" }}
                        >
                          {deckMeta.subtitle}
                        </div>
                        {/* A shelved deck says why it is shelved, so nobody
                            wonders whether they picked the wrong one. */}
                        {deckMeta.shelfReason && (
                          <p
                            className="text-[11px] italic leading-snug m-0"
                            style={{ color: "var(--stage-text-dim)" }}
                          >
                            {deckMeta.shelfReason}
                          </p>
                        )}
                      </div>

                      <div
                        className="pt-2 border-t flex items-center justify-between text-[11px] font-mono"
                        style={{
                          borderColor: "var(--stage-border)",
                          color: "var(--stage-text-dim)",
                        }}
                      >
                        <span>{deckMeta.slideCount ? `${deckMeta.slideCount} slides` : "Ready"}</span>
                        <span className="font-bold" style={{ color: "var(--stage-accent)" }}>
                          Launch &rarr;
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const WorkshopSlides = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Active deck selection
  const validDeckIds = [
    "combined",
    "unified",
    "keynote",
    "master",
    "lightning",
    "lightning-talk",
    "workshop",
    "labs",
    "nomad",
    "ripcord",
    "iron",
    "lhm",
    "devfest",
    "pride",
    "reacher",
    "chainsaw",
  ];
  const activeDeckId = deckId && validDeckIds.includes(deckId) ? deckId : DEFAULT_DECK_ID;
  const currentDeck = getDeck(activeDeckId);
  const allDecks = getAllDecks();

  const allSlides = currentDeck.slides;
  const presenterNotes = currentDeck.presenterNotes || {};

  /**
   * Elastic runtime. The deck contracts to a 15-minute spine or expands to a
   * full keynote without the content being duplicated anywhere. `openZones`
   * holds flex zones the speaker pulled in live — the "while it builds" case,
   * where you need standing room for an unknown number of minutes.
   */
  const [runtimeId, setRuntimeId] = useState(
    () => currentDeck.meta?.defaultRuntime ?? DEFAULT_RUNTIME
  );
  const [openZones, setOpenZones] = useState([]);
  const runtime = getRuntime(runtimeId);

  const slides = useMemo(
    () => selectSlides(allSlides, { runtime: runtimeId, openZones }),
    [allSlides, runtimeId, openZones]
  );
  const flexZones = useMemo(() => getFlexZones(allSlides), [allSlides]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRezeMode, setIsRezeMode] = useState(false);

  const containerRef = useRef(null);

  // Sync clock for Reacher's exact internal timekeeping easter egg
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const formatReacherClock = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const goToSlide = useCallback(
    (index) => {
      if (index >= 0 && index < slides.length) {
        trackEvent("slide_nav", {
          deck: activeDeckId,
          slideId: slides[index].id,
          index,
        });
        setCurrentSlide(index);
      }
    },
    [slides, activeDeckId]
  );

  const nextSlide = useCallback(
    () => goToSlide(currentSlide + 1),
    [currentSlide, goToSlide]
  );
  const prevSlide = useCallback(
    () => goToSlide(currentSlide - 1),
    [currentSlide, goToSlide]
  );

  /**
   * Pull a flex zone in or drop it mid-talk. Opening keeps you on the slide you
   * are standing on: the zone's slides are inserted in deck order, so the index
   * is re-anchored by id rather than by position.
   */
  /**
   * Re-anchor by slide id, not by index.
   *
   * Changing the runtime or opening a zone changes the LENGTH of the selection
   * under you, so the old index points at a different slide — or off the end.
   * Both handlers compute the next selection up front and land you back on the
   * slide you were actually standing on.
   *
   * Everything here is computed before the setState calls rather than inside an
   * updater: updaters must be pure, and React invokes them twice under
   * StrictMode, which would fire the telemetry event twice per press.
   */
  const reanchor = useCallback(
    (anchorId, nextSlides) => {
      const idx = nextSlides.findIndex((s) => s.id === anchorId);
      setCurrentSlide(idx >= 0 ? idx : 0);
    },
    []
  );

  const toggleZone = useCallback(
    (zoneId) => {
      const anchorId = slides[currentSlide]?.id;
      const isOpen = openZones.includes(zoneId);
      const next = isOpen ? openZones.filter((z) => z !== zoneId) : [...openZones, zoneId];

      setOpenZones(next);
      trackEvent("flex_zone_toggle", { deck: activeDeckId, zone: zoneId, open: !isOpen });
      reanchor(anchorId, selectSlides(allSlides, { runtime: runtimeId, openZones: next }));
    },
    [slides, currentSlide, openZones, allSlides, runtimeId, activeDeckId, reanchor]
  );

  const changeRuntime = useCallback(
    (nextRuntimeId) => {
      const anchorId = slides[currentSlide]?.id;

      setRuntimeId(nextRuntimeId);
      trackEvent("runtime_change", { deck: activeDeckId, runtime: nextRuntimeId });
      reanchor(anchorId, selectSlides(allSlides, { runtime: nextRuntimeId, openZones }));
    },
    [slides, currentSlide, allSlides, openZones, activeDeckId, reanchor]
  );

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Reset the whole presentation state when the deck changes.
  //
  // `runtimeId`'s useState initializer only runs on the first mount, and
  // switching /slides/lhm -> /slides/devfest changes a route param without
  // remounting this component. Without this, the new deck would inherit the
  // previous deck's runtime and any flex zones left open — so opening the
  // DevFest workshop after rehearsing the lightning talk would silently show
  // you the 15-minute cut of it.
  useEffect(() => {
    setCurrentSlide(0);
    setRuntimeId(currentDeck.meta?.defaultRuntime ?? DEFAULT_RUNTIME);
    setOpenZones([]);
  }, [activeDeckId, currentDeck.meta?.defaultRuntime]);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "n" || e.key === "N") {
        setShowNotes((prev) => !prev);
      } else if (e.key === "t" || e.key === "T") {
        setIsTimerRunning((prev) => !prev);
      } else if (e.key === "r" || e.key === "R") {
        setElapsedTime(0);
      } else if ((e.key === "p" || e.key === "P") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handlePrint();
      } else if (!e.metaKey && !e.ctrlKey && !e.altKey && (e.key === "d" || e.key === "D")) {
        setShowDeckModal((prev) => !prev);
      } else if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key === "z") {
        // Z pulls the first flex zone in or drops it. The one-key move you make
        // on stage while an agent is still working.
        if (flexZones[0]) toggleZone(flexZones[0].id);
      } else if (!e.metaKey && !e.ctrlKey && !e.altKey && ["1", "2", "3", "4"].includes(e.key)) {
        // Runtime switching: contract or expand the deck mid-talk.
        const order = ["lightning", "standard", "keynote", "workshop"];
        changeRuntime(order[Number(e.key) - 1]);
      } else if (e.key === "Home") {
        goToSlide(0);
      } else if (e.key === "End") {
        goToSlide(slides.length - 1);
      } else if (e.key === "Escape") {
        if (showDeckModal) {
          setShowDeckModal(false);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, toggleFullscreen, isFullscreen, goToSlide, slides.length, handlePrint, navigate, showDeckModal, flexZones, toggleZone, changeRuntime]);

  // Touch/swipe support
  useEffect(() => {
    let startX = 0;
    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
    };
    const handleTouchEnd = (e) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? nextSlide() : prevSlide();
      }
    };

    const container = containerRef.current;
    container?.addEventListener("touchstart", handleTouchStart);
    container?.addEventListener("touchend", handleTouchEnd);
    return () => {
      container?.removeEventListener("touchstart", handleTouchStart);
      container?.removeEventListener("touchend", handleTouchEnd);
    };
  }, [nextSlide, prevSlide]);

  // A contracting runtime can leave the index past the end of the selection.
  useEffect(() => {
    if (currentSlide > slides.length - 1) setCurrentSlide(Math.max(0, slides.length - 1));
  }, [slides.length, currentSlide]);

  const slide = slides[currentSlide] || slides[0];
  const SlideComponent = SlideComponents[slide.type] || TitleSlide;
  const progress = ((currentSlide + 1) / slides.length) * 100;

  const currentAccent = currentDeck.meta?.accent || "var(--color-primary, #00ffcc)";
  const accentColor = isRezeMode ? "#ff0055" : currentAccent;

  // Where you stand against plan. Positive drift means running long.
  const pacing = pacingStatus(slides, currentSlide, elapsedTime);
  const pacingColor =
    pacing.status === "behind"
      ? "var(--stage-danger)"
      : pacing.status === "ahead"
        ? "var(--stage-accent-alt)"
        : "var(--stage-ok)";

  return (
    <div
      ref={containerRef}
      /* `.stage` carries the whole token palette; `data-stage-mode` swaps it.
         The Reze Override is one attribute, not a ternary on every element. */
      className={`stage stage-grid-bg min-h-screen flex flex-col relative overflow-hidden select-none transition-colors duration-500 ${
        isRezeMode ? "reze-mode" : ""
      }`}
      data-stage-mode={isRezeMode ? "reze" : "protocol"}
      style={{ fontFamily: "var(--stage-font-display)" }}
    >
      {/* Glitch Keyframes CSS injection */}
      <style>{`
        @keyframes reze-pulse {
          0% { box-shadow: 0 0 10px #ff0055; }
          100% { box-shadow: 0 0 30px #ff0055, 0 0 10px #c6ff00; }
        }
        @keyframes glitch-anim {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        .reze-glitch {
          animation: glitch-anim 0.25s infinite;
        }
        @media print {
          body, .min-h-screen {
            background: #fff !important;
            color: #000 !important;
            background-image: none !important;
          }
          header, footer, #reze-btn, .print-hide {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Deck Switcher & Reze Override Bar */}
      <header className="fixed top-0 left-0 right-0 h-14 z-40 backdrop-blur-md bg-(--color-surface-dark)/90 border-b border-(--color-border-dark)/80 px-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Link
            to="/guide"
            className="px-2.5 py-1 rounded-lg bg-(--color-surface-dark) border border-(--color-border-dark) text-(--color-muted-text-dark) hover:text-(--color-text-dark) transition-colors flex items-center gap-1.5 font-mono"
            title="Return to Workshop Guide"
          >
            <span aria-hidden="true">
              <ChevronLeft className="w-3.5 h-3.5" />
            </span>
            <span>Guide</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1 text-(--color-muted-text-dark) font-mono">
            <span style={{ color: accentColor }} className="font-bold">
              Deck:
            </span>
            <span className="text-(--color-text-dark) font-semibold">{currentDeck.meta.title}</span>
          </div>
        </div>

        {/* Runtime + flex-zone controls.
            This bar used to switch between six decks, which is not a decision
            you make on stage. What you DO decide live is how long you have and
            whether the build gave you time to fill — so the bar controls that. */}
        <nav
          aria-label="Stage controls"
          className="flex items-center gap-1 bg-(--color-surface-dark)/80 p-1 rounded-[2px] border border-(--color-border-dark) overflow-x-auto max-w-3xl"
        >
          <ul className="flex items-center gap-1 list-none m-0 p-0">
            {Object.values(RUNTIMES).map((rt, i) => (
              <li key={rt.id}>
                <button
                  type="button"
                  id={`stage-runtime-${rt.id}`}
                  onClick={() => changeRuntime(rt.id)}
                  aria-pressed={rt.id === runtimeId}
                  className="stage-btn whitespace-nowrap"
                  style={{ fontSize: "11px", padding: "0.25em 0.6em" }}
                  title={`${rt.blurb} (Hotkey ${i + 1})`}
                >
                  {rt.label} · {rt.minutes >= 240 ? "Lab" : `${rt.minutes}m`}
                </button>
              </li>
            ))}
          </ul>

          {flexZones.length > 0 && (
            <>
              <div className="w-px h-4 bg-(--color-border-dark) mx-1 shrink-0" />
              <ul className="flex items-center gap-1 list-none m-0 p-0">
                {flexZones.map((zone) => (
                  <li key={zone.id}>
                    <button
                      type="button"
                      id={`stage-zone-${zone.id}`}
                      onClick={() => toggleZone(zone.id)}
                      aria-pressed={openZones.includes(zone.id)}
                      className="stage-btn whitespace-nowrap"
                      style={{ fontSize: "11px", padding: "0.25em 0.6em" }}
                      title={`${zone.label} — ${zone.slides.length} slides, ${formatClock(zone.seconds)} of material (Hotkey Z)`}
                    >
                      Flex {formatClock(zone.seconds)} (Z)
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="w-px h-4 bg-(--color-border-dark) mx-1 shrink-0" />

          <button
            type="button"
            id="deck-directory-btn"
            onClick={() => setShowDeckModal(true)}
            className="stage-btn whitespace-nowrap"
            style={{ fontSize: "11px", padding: "0.25em 0.6em" }}
            title="Open the deck directory (Hotkey D)"
          >
            Decks (D)
          </button>
        </nav>

        {/* Reze Mode Switch Button */}
        <div className="flex items-center gap-2">
          <button
            id="reze-btn"
            onClick={() => setIsRezeMode(!isRezeMode)}
            className="px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold uppercase transition-all cursor-pointer border"
            style={{
              backgroundColor: isRezeMode ? "#ff0055" : "rgba(0,0,0,0.6)",
              color: isRezeMode ? "#fff" : accentColor,
              borderColor: isRezeMode ? "#fff" : accentColor,
              animation: isRezeMode ? "reze-pulse 1.5s infinite alternate" : "none",
            }}
            title="Toggle between Reacher Deduction and Reze Overwhelming Velocity"
          >
            {isRezeMode ? "[ DANGER: REZE ACTIVE ]" : "[ SYSTEM NORMAL ]"}
          </button>

          {/* Reacher Clock Easter Egg */}
          <div className="hidden xl:flex items-center gap-1 font-mono text-[11px] text-(--color-muted-text-dark)">
            <span className="text-amber-400 font-bold">Clock:</span>
            <span className="font-semibold text-(--color-text-dark)">{formatReacherClock(currentTime)}</span>
          </div>
        </div>
      </header>

      {/* Integrated Deck Directory Modal */}
      <DeckDirectoryModal
        isOpen={showDeckModal}
        onClose={() => setShowDeckModal(false)}
        activeDeckId={activeDeckId}
        onSelectDeck={(id) => navigate(`/slides/${id}`)}
        allDecks={allDecks}
      />

      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-30">
        <div
          className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] rounded-full filter blur-[140px] transition-colors duration-700"
          style={{
            backgroundColor: "var(--stage-accent)",
          }}
        />
        <div
          className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] rounded-full filter blur-[140px] transition-colors duration-700"
          style={{
            backgroundColor: "var(--stage-accent-alt)",
          }}
        />
      </div>

      {/* Progress bar */}
      <div className="fixed top-14 left-0 right-0 h-1 z-50 bg-gray-950">
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            backgroundColor: accentColor,
            boxShadow: `0 0 10px ${accentColor}`,
          }}
        />
      </div>

      {/* Main Slide Presentation Stage */}
      <main className="flex-1 flex items-center justify-center px-6 md:px-12 pt-20 pb-20 z-10">
        <div className="w-full max-w-6xl">
          {SlideComponent && (
            <SlideComponent
              slide={slide}
              isActive={true}
              isRezeMode={isRezeMode}
              onToggleReze={() => setIsRezeMode(!isRezeMode)}
              onOpenZone={toggleZone}
            />
          )}
        </div>
      </main>

      {/* Presenter Notes Overlay */}
      {showNotes && (
        <div
          className="fixed bottom-20 right-4 p-5 rounded-2xl shadow-2xl border max-w-md backdrop-blur-xl z-50 animate-fade-in bg-(--color-surface-dark)/95 text-(--color-text-dark)"
          style={{
            borderColor: accentColor,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h4
              className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: accentColor }}
            >
              <EmojiIcon name="mic" className="w-4 h-4" /> Presenter Dossier
            </h4>
            <button
              onClick={() => setShowNotes(false)}
              aria-label="Close notes"
              className="p-1 rounded-lg text-(--color-muted-text-dark) hover:text-(--color-text-dark) hover:bg-(--color-surface-hover-dark) transition-colors cursor-pointer"
            >
              <Close className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-sm leading-relaxed opacity-95 font-sans whitespace-pre-line">
            {slide.notes || presenterNotes[slide.id] || presenterNotes[currentSlide] || "No speaker notes recorded for this slide."}
          </p>

          {/* Pacing: planned vs actual. Visible before the drift becomes a problem. */}
          <dl className="mt-4 pt-3 border-t border-(--color-border-dark) grid grid-cols-3 gap-2 text-center m-0">
            <div>
              <dt className="text-[9px] uppercase tracking-widest text-(--color-muted-text-dark) font-mono m-0">Elapsed</dt>
              <dd className="text-sm font-mono font-bold text-(--color-text-dark) m-0">{formatClock(elapsedTime)}</dd>
            </div>
            <div>
              <dt className="text-[9px] uppercase tracking-widest text-(--color-muted-text-dark) font-mono m-0">Planned</dt>
              <dd className="text-sm font-mono font-bold text-(--color-text-dark) m-0">{formatClock(pacing.plannedSeconds)}</dd>
            </div>
            <div>
              <dt className="text-[9px] uppercase tracking-widest text-(--color-muted-text-dark) font-mono m-0">Drift</dt>
              <dd className="text-sm font-mono font-bold m-0" style={{ color: pacingColor }}>
                {formatDrift(pacing.driftSeconds)}
              </dd>
            </div>
          </dl>

          {/* Runtime: contract or expand the deck mid-talk. */}
          <div className="mt-3 pt-3 border-t border-(--color-border-dark)">
            <p className="text-[9px] uppercase tracking-widest text-(--color-muted-text-dark) font-mono mb-1.5 m-0">
              Runtime — {slides.length} slides / {formatClock(pacing.totalSeconds)} planned
            </p>
            <ul className="flex flex-wrap gap-1 list-none m-0 p-0">
              {Object.values(RUNTIMES).map((rt, i) => (
                <li key={rt.id}>
                  <button
                    type="button"
                    id={`runtime-${rt.id}`}
                    onClick={() => changeRuntime(rt.id)}
                    aria-pressed={rt.id === runtimeId}
                    title={rt.blurb}
                    className="stage-btn"
                    style={{ fontSize: "10px", padding: "0.3em 0.6em" }}
                  >
                    {i + 1} {rt.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Flex zones: standing room, pulled in on demand. */}
          {flexZones.length > 0 && (
            <div className="mt-3 pt-3 border-t border-(--color-border-dark)">
              <p className="text-[9px] uppercase tracking-widest text-(--color-muted-text-dark) font-mono mb-1.5 m-0">
                Flex Zones — pull in while a build runs
              </p>
              <ul className="flex flex-wrap gap-1 list-none m-0 p-0">
                {flexZones.map((zone) => (
                  <li key={zone.id}>
                    <button
                      type="button"
                      id={`zone-${zone.id}`}
                      onClick={() => toggleZone(zone.id)}
                      aria-pressed={openZones.includes(zone.id)}
                      className="stage-btn"
                      style={{ fontSize: "10px", padding: "0.3em 0.6em" }}
                    >
                      {zone.label} · {zone.slides.length} · {formatClock(zone.seconds)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-(--color-border-dark) text-[10px] text-(--color-muted-text-dark) font-mono font-medium">
            1-4 Runtime &bull; Z Flex Zone &bull; N Notes &bull; P PDF &bull; F Fullscreen &bull; T Timer &bull; R Reset
          </div>
        </div>
      )}

      {/* Bottom HUD Controls */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 flex items-center justify-between z-40 backdrop-blur-md bg-(--color-surface-dark)/80 border-t border-(--color-border-dark)/80">
        <div className="flex items-center gap-3">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="p-2.5 rounded-xl transition-all hover:scale-105 disabled:opacity-20 cursor-pointer bg-(--color-surface-dark) text-(--color-text-dark) hover:bg-(--color-surface-hover-dark) border border-(--color-border-dark)"
            aria-label="Previous slide"
          >
            <span aria-hidden="true" className="block">
              <ChevronLeft className="w-4 h-4" />
            </span>
          </button>
          <span className="text-xs font-mono text-(--color-muted-text-dark) font-bold">
            {(currentSlide + 1).toString().padStart(2, "0")} / {slides.length.toString().padStart(2, "0")}
          </span>
          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="p-2.5 rounded-xl transition-all hover:scale-105 disabled:opacity-20 cursor-pointer text-(--color-primary-text) font-bold shadow-md"
            style={{ backgroundColor: accentColor }}
            aria-label="Next slide"
          >
            <span aria-hidden="true" className="block">
              <ChevronRight className="w-4 h-4" />
            </span>
          </button>

          <span
            className="text-xs font-mono text-(--color-muted-text-dark) cursor-pointer select-none hover:text-(--color-text-dark) transition-colors ml-2 inline-flex items-center gap-1 font-semibold"
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            title="Click to Play/Pause timer. Press R to reset."
          >
            <EmojiIcon name="clock" className="w-3.5 h-3.5 inline" /> {formatTime(elapsedTime)}
          </span>
        </div>

        {/* Slide Navigation Dots */}
        <div className="hidden md:flex gap-1.5 max-w-md overflow-x-auto py-1">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goToSlide(i)}
              className="w-2.5 h-2.5 rounded-full transition-all cursor-pointer"
              style={{
                backgroundColor: i === currentSlide ? accentColor : "var(--stage-text-dim)",
                transform: i === currentSlide ? "scale(1.3)" : "scale(1)",
              }}
              title={s.title}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Right utility buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer border bg-(--color-surface-dark) text-(--color-muted-text-dark) border-(--color-border-dark) hover:text-(--color-text-dark)"
            title="Export / Print Slides to PDF (P)"
            aria-label="Export to PDF"
          >
            PDF Export (P)
          </button>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer border"
            style={{
              backgroundColor: showNotes ? accentColor : "var(--color-surface-dark)",
              color: showNotes ? "var(--color-primary-text)" : "var(--color-muted-text-dark)",
              borderColor: showNotes ? accentColor : "var(--color-border-dark)",
            }}
            title="Presenter Notes (N)"
            aria-label="Toggle presenter notes"
          >
            Notes (N)
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-(--color-surface-dark) text-(--color-muted-text-dark) border border-(--color-border-dark) hover:text-(--color-text-dark) transition-all cursor-pointer text-xs font-mono"
            title="Fullscreen (F)"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? "Exit" : "Fullscreen"}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default WorkshopSlides;
