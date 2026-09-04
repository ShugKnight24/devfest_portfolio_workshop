import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { EmojiIcon } from "@portfolio/icons/react";
import { Checkmark, Close } from "../components/Icons";
import { trackEvent } from "@portfolio/telemetry";
import { getDeck, getAllDecks, DEFAULT_DECK_ID } from "../data/slides";

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
const TitleSlide = ({ slide, isActive, isRezeMode }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] text-center transition-all duration-700 max-w-5xl mx-auto px-4 ${
      isActive ? "opacity-100 scale-100" : "opacity-0 scale-95"
    }`}
  >
    {slide.conferenceBadge && (
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs font-bold uppercase tracking-widest mb-6 border transition-all"
        style={{
          backgroundColor: isRezeMode ? "rgba(255, 0, 85, 0.12)" : "rgba(0, 255, 204, 0.1)",
          borderColor: isRezeMode ? "#ff0055" : "#00ffcc",
          color: isRezeMode ? "#ff0055" : "#00ffcc",
          boxShadow: isRezeMode ? "0 0 15px rgba(255,0,85,0.3)" : "0 0 15px rgba(0,255,204,0.2)",
        }}
      >
        <EmojiIcon name="mic" className="w-3.5 h-3.5" />
        {slide.conferenceBadge}
      </div>
    )}
    <div className="relative">
      <h1
        className={`text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4 uppercase ${
          isRezeMode ? "reze-glitch text-[#ff0055]" : "text-[#00ffcc]"
        }`}
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          textShadow: isRezeMode
            ? "2px 0 #ff0055, -2px 0 #c6ff00"
            : "0 0 30px rgba(0,255,204,0.3)",
        }}
      >
        {slide.title}
      </h1>
      <div
        className="absolute -inset-4 opacity-25 blur-3xl -z-10 transition-colors"
        style={{ backgroundColor: isRezeMode ? "#ff0055" : "#00ffcc" }}
      />
    </div>
    <p
      className="text-xl md:text-3xl font-bold mt-2 max-w-4xl tracking-wide uppercase font-mono"
      style={{ color: isRezeMode ? "#c6ff00" : "#ffcc00" }}
    >
      {slide.subtitle}
    </p>
    <p className="text-base md:text-xl mt-6 max-w-3xl text-gray-300 leading-relaxed font-sans">
      {slide.description}
    </p>
    <div className="mt-10 flex gap-2">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full animate-bounce"
          style={{
            backgroundColor: isRezeMode ? "#ff0055" : "#00ffcc",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  </div>
);

// Slide 2: Reacher Formula Intro Slide
const ReacherIntroSlide = ({ slide, isActive, isRezeMode }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] transition-all duration-700 max-w-5xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <div className="text-center mb-8">
      <span
        className="text-xs font-mono uppercase tracking-widest font-bold px-3 py-1 rounded border inline-block mb-3"
        style={{
          backgroundColor: isRezeMode ? "rgba(255, 0, 85, 0.15)" : "rgba(0, 255, 204, 0.1)",
          borderColor: isRezeMode ? "#ff0055" : "#00ffcc",
          color: isRezeMode ? "#ff0055" : "#00ffcc",
        }}
      >
        THE REACHER FORMULA
      </span>
      <h2
        className={`text-3xl md:text-5xl font-black mt-1 mb-3 uppercase ${
          isRezeMode ? "text-[#ff0055]" : "text-[#00ffcc]"
        }`}
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {slide.title}
      </h2>
      <p className="text-base md:text-lg text-gray-300 italic max-w-2xl mx-auto">
        "{slide.quote}"
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {slide.traits.map((trait, idx) => (
        <div
          key={idx}
          className="p-6 rounded-2xl bg-(--color-surface-dark)/80 border backdrop-blur-md transition-all flex flex-col justify-between shadow-xl"
          style={{
            borderColor: isRezeMode ? "rgba(255, 0, 85, 0.3)" : "var(--color-border-dark)",
            borderLeftWidth: "4px",
            borderLeftColor: isRezeMode ? "#ff0055" : "#00ffcc",
          }}
        >
          <div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{
                backgroundColor: isRezeMode ? "rgba(255, 0, 85, 0.2)" : "rgba(0, 255, 204, 0.15)",
                color: isRezeMode ? "#ff0055" : "#00ffcc",
              }}
            >
              <EmojiIcon name={trait.icon} className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-(--color-text-dark) mb-2 uppercase font-mono">
              {trait.title}
            </h3>
            <p className="text-xs text-(--color-muted-text-dark) leading-relaxed mb-4">
              {trait.description}
            </p>
          </div>
          <div
            className="pt-3 border-t font-mono text-[11px] italic"
            style={{
              borderColor: "var(--color-border-dark)",
              color: isRezeMode ? "#c6ff00" : "#ffcc00",
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
const EnergySlide = ({ slide, isActive, isRezeMode }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] transition-all duration-700 max-w-5xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center w-full">
      <div>
        <span
          className="text-xs font-mono uppercase tracking-widest font-bold px-3 py-1 rounded border inline-block mb-3"
          style={{
            backgroundColor: isRezeMode ? "rgba(255, 0, 85, 0.15)" : "rgba(0, 255, 204, 0.1)",
            borderColor: isRezeMode ? "#ff0055" : "#00ffcc",
            color: isRezeMode ? "#ff0055" : "#00ffcc",
          }}
        >
          {slide.subtitle || "PHASE 01 // TOKEN ECONOMICS"}
        </span>
        <h2
          className={`text-4xl md:text-6xl font-black uppercase tracking-tight mb-4 ${
            isRezeMode ? "text-[#ff0055]" : "text-[#00ffcc]"
          }`}
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {slide.title}
        </h2>
        <p className="text-base text-gray-300 leading-relaxed mb-4">
          {slide.description}
        </p>
        {slide.videoUrl && (
          <a
            href={slide.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all hover:scale-105 border cursor-pointer"
            style={{
              backgroundColor: "rgba(0,0,0,0.5)",
              borderColor: isRezeMode ? "#ff0055" : "#00ffcc",
              color: isRezeMode ? "#ff0055" : "#00ffcc",
            }}
          >
            <EmojiIcon name="play" className="w-3.5 h-3.5 fill-current" />
            Watch Steve Ballmer "Developers!" Clip →
          </a>
        )}
      </div>

      {/* Code Terminal */}
      <div
        className="w-full rounded-2xl overflow-hidden shadow-2xl border backdrop-blur-lg bg-(--color-surface-dark)/95"
        style={{
          borderColor: isRezeMode ? "#ff0055" : "var(--color-primary, #00ffcc)",
          borderLeftWidth: "5px",
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-(--color-surface-dark) border-b border-(--color-border-dark)">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs font-mono text-(--color-text-dark) font-semibold">protocol.js</span>
        </div>
        <pre className="p-5 text-xs md:text-sm font-mono overflow-x-auto text-gray-100 leading-relaxed">
          <code>
            {slide.content.split("\n").map((line, i) => {
              const isComment = line.trim().startsWith("//") || line.trim().startsWith("/*");
              const isKeyword = line.includes("const ") || line.includes("function ") || line.includes("return ");
              return (
                <div key={i} className="leading-6">
                  {isComment ? (
                    <span className="text-gray-300 italic font-medium">{line}</span>
                  ) : isKeyword ? (
                    <span style={{ color: isRezeMode ? "#ff0055" : "#00ffcc" }}>{line}</span>
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
const ZeroBloatSlide = ({ slide, isActive, isRezeMode }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] transition-all duration-700 max-w-5xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">
      {/* Left Column: Photo Drop Zone */}
      <div
        className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 min-h-[340px] relative overflow-hidden text-center transition-all bg-(--color-surface-dark)/40"
        style={{
          borderColor: isRezeMode ? "rgba(255, 0, 85, 0.4)" : "var(--color-border-dark)",
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
        <div className="z-10 flex flex-col items-center gap-3 text-(--color-text-dark) font-mono text-xs uppercase tracking-wider font-semibold">
          <EmojiIcon name="camera" className="w-8 h-8 opacity-80" />
          <span>{slide.photoZoneText || "[ DROP DEADLIFT / TECH PHOTO HERE ]"}</span>
          <span className="text-[10px] text-(--color-muted-text-dark) font-medium">
            Sovereign Physical Rigor &bull; Lean Architecture
          </span>
        </div>
      </div>

      {/* Right Column: Zero Bloat Narrative */}
      <div>
        <span
          className="text-xs font-mono uppercase tracking-widest font-bold px-3 py-1 rounded border inline-block mb-3"
          style={{
            backgroundColor: isRezeMode ? "rgba(255, 0, 85, 0.15)" : "rgba(0, 255, 204, 0.1)",
            borderColor: isRezeMode ? "#ff0055" : "#00ffcc",
            color: isRezeMode ? "#ff0055" : "#00ffcc",
          }}
        >
          {slide.subtitle || "PHASE 02 // ARCHITECTURE"}
        </span>
        <h2
          className={`text-4xl md:text-6xl font-black uppercase tracking-tight mb-4 ${
            isRezeMode ? "text-[#ff0055]" : "text-[#00ffcc]"
          }`}
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {slide.title}
        </h2>
        <blockquote
          className="text-lg md:text-xl font-bold italic mb-4 font-mono"
          style={{ color: isRezeMode ? "#c6ff00" : "#ffcc00" }}
        >
          "{slide.quote}"
        </blockquote>
        <p className="text-base text-gray-300 leading-relaxed">
          {slide.description}
        </p>
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
      className="p-10 md:p-14 rounded-3xl border-2 backdrop-blur-xl w-full shadow-2xl transition-all"
      style={{
        backgroundColor: isRezeMode ? "rgba(20, 0, 10, 0.85)" : "rgba(10, 15, 15, 0.85)",
        borderColor: isRezeMode ? "#ff0055" : "#ffcc00",
        boxShadow: isRezeMode
          ? "0 0 50px rgba(255, 0, 85, 0.3)"
          : "0 0 50px rgba(255, 204, 0, 0.2)",
      }}
    >
      <span
        className="text-xs font-mono uppercase tracking-widest font-bold px-4 py-1.5 rounded border inline-block mb-4"
        style={{
          backgroundColor: isRezeMode ? "rgba(255, 0, 85, 0.2)" : "rgba(255, 204, 0, 0.15)",
          borderColor: isRezeMode ? "#ff0055" : "#ffcc00",
          color: isRezeMode ? "#ff0055" : "#ffcc00",
        }}
      >
        {slide.subtitle || "SYSTEM WARNING // VELOCITY CEILING"}
      </span>
      <h2
        className={`text-4xl md:text-6xl font-black uppercase tracking-tight mb-4 ${
          isRezeMode ? "reze-glitch text-[#ff0055]" : "text-white"
        }`}
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {slide.title}
      </h2>
      <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
        {slide.description}
      </p>

      {/* Interactive Trigger Button right inside the slide */}
      <button
        onClick={onToggleReze}
        className="px-8 py-4 rounded-xl font-mono text-sm font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
        style={{
          backgroundColor: isRezeMode ? "#ff0055" : "#ffcc00",
          color: "#000",
          boxShadow: isRezeMode
            ? "0 0 25px rgba(255, 0, 85, 0.6)"
            : "0 0 25px rgba(255, 204, 0, 0.5)",
        }}
      >
        {isRezeMode
          ? "[ REZE OVERRIDE ENGAGED — SYSTEM RUNNING AT MAX VELOCITY ]"
          : "[ CLICK TO ENGAGE REZE OVERRIDE PROTOCOL ]"}
      </button>

      <p className="mt-4 font-mono text-xs text-gray-300 font-semibold uppercase">
        {isRezeMode
          ? "Explosive Chainsaw Man execution mode active"
          : slide.triggerPrompt || ">> SPEAKER: INITIATE REZE OVERRIDE (TOP RIGHT) <<"}
      </p>
    </div>
  </div>
);

// Slide 6: Paradigm Shift Slide (Audience of One)
const ParadigmSlide = ({ slide, isActive, isRezeMode }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] transition-all duration-700 max-w-5xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <div className="text-center mb-8">
      <span
        className="text-xs font-mono uppercase tracking-widest font-bold px-3 py-1 rounded border inline-block mb-3"
        style={{
          backgroundColor: isRezeMode ? "rgba(255, 0, 85, 0.15)" : "rgba(0, 255, 204, 0.1)",
          borderColor: isRezeMode ? "#ff0055" : "#00ffcc",
          color: isRezeMode ? "#ff0055" : "#00ffcc",
        }}
      >
        {slide.subtitle || "PARADIGM SHIFT // EXECUTE"}
      </span>
      <h2
        className={`text-3xl md:text-5xl font-black uppercase mb-2 ${
          isRezeMode ? "text-[#ff0055]" : "text-[#00ffcc]"
        }`}
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {slide.title}
      </h2>
      <p className="text-sm md:text-base text-gray-300 max-w-2xl mx-auto">
        {slide.description || "Traditional advice: spend weeks polishing a static resume. Burn the resume. Build bespoke software to eliminate your own acute daily friction."}
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {slide.steps.map((st, i) => (
        <div
          key={i}
          className="p-6 rounded-2xl bg-(--color-surface-dark)/80 border backdrop-blur-md transition-all flex flex-col justify-between shadow-xl"
          style={{
            borderColor: isRezeMode ? "rgba(255, 0, 85, 0.3)" : "var(--color-border-dark)",
            borderLeftWidth: "4px",
            borderLeftColor: isRezeMode ? "#ff0055" : "#00ffcc",
          }}
        >
          <div>
            <span
              className="text-3xl font-black font-mono mb-2 block"
              style={{ color: isRezeMode ? "#c6ff00" : "#ffcc00" }}
            >
              {st.step}
            </span>
            <h4 className="text-xl font-bold text-(--color-text-dark) mb-2 uppercase font-mono">
              {st.label}
            </h4>
            <p className="text-xs text-(--color-muted-text-dark) leading-relaxed">{st.desc}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-(--color-border-dark) text-[10px] font-mono text-(--color-muted-text-dark) font-semibold uppercase">
            Evolution Stage {st.step}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Slide 7: Case Studies Slide (Production Scale)
const CaseStudiesSlide = ({ slide, isActive, isRezeMode }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] transition-all duration-700 max-w-5xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <div className="text-center mb-8">
      <span
        className="text-xs font-mono uppercase tracking-widest font-bold px-3 py-1 rounded border inline-block mb-3"
        style={{
          backgroundColor: isRezeMode ? "rgba(255, 0, 85, 0.15)" : "rgba(0, 255, 204, 0.1)",
          borderColor: isRezeMode ? "#ff0055" : "#00ffcc",
          color: isRezeMode ? "#ff0055" : "#00ffcc",
        }}
      >
        {slide.subtitle || "PROOF OF WORK // PRODUCTION SCALE"}
      </span>
      <h2
        className={`text-3xl md:text-5xl font-black uppercase mb-2 ${
          isRezeMode ? "text-[#ff0055]" : "text-[#00ffcc]"
        }`}
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {slide.title}
      </h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {slide.items.map((item, idx) => (
        <div
          key={idx}
          className="p-6 rounded-2xl bg-(--color-surface-dark)/80 border backdrop-blur-md transition-all flex flex-col justify-between shadow-xl"
          style={{
            borderColor: isRezeMode ? "rgba(255, 0, 85, 0.3)" : "var(--color-border-dark)",
            borderLeftWidth: "4px",
            borderLeftColor: isRezeMode ? "#ff0055" : "#00ffcc",
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-[10px] font-mono font-bold px-2.5 py-1 rounded uppercase tracking-wider"
                style={{
                  backgroundColor: isRezeMode ? "rgba(255, 0, 85, 0.2)" : "rgba(0, 255, 204, 0.15)",
                  color: isRezeMode ? "#ff0055" : "#00ffcc",
                }}
              >
                {item.category}
              </span>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: isRezeMode ? "rgba(255, 0, 85, 0.2)" : "rgba(0, 255, 204, 0.15)",
                  color: isRezeMode ? "#ff0055" : "#00ffcc",
                }}
              >
                <EmojiIcon name={item.icon || "box"} className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-(--color-text-dark) mb-3 font-mono">{item.title}</h3>
            <div className="space-y-2 text-xs">
              <p className="text-(--color-muted-text-dark)">
                <strong className="text-red-400 font-mono">Friction:</strong> {item.problem}
              </p>
              <p className="text-(--color-muted-text-dark)">
                <strong
                  className="font-mono"
                  style={{ color: isRezeMode ? "#c6ff00" : "#00ffcc" }}
                >
                  Solution:
                </strong>{" "}
                {item.solution}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-(--color-border-dark) text-xs font-semibold text-(--color-muted-text-dark) font-mono">
            Impact: {item.impact}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Slide 8: Process Slide (Agentic Dev Loop CI Gate)
const ProcessSlide = ({ slide, isActive, isRezeMode }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] transition-all duration-700 max-w-5xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <div className="text-center mb-8">
      <span
        className="text-xs font-mono uppercase tracking-widest font-bold px-3 py-1 rounded border inline-block mb-3"
        style={{
          backgroundColor: isRezeMode ? "rgba(255, 0, 85, 0.15)" : "rgba(0, 255, 204, 0.1)",
          borderColor: isRezeMode ? "#ff0055" : "#00ffcc",
          color: isRezeMode ? "#ff0055" : "#00ffcc",
        }}
      >
        {slide.subtitle || "ARCHITECTURE // CI GATE"}
      </span>
      <h2
        className={`text-3xl md:text-5xl font-black uppercase mb-2 ${
          isRezeMode ? "text-[#ff0055]" : "text-[#00ffcc]"
        }`}
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {slide.title}
      </h2>
      {slide.quote && (
        <p className="text-sm md:text-base text-gray-300 italic max-w-2xl mx-auto">
          "{slide.quote}"
        </p>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {slide.stages.map((st, i) => (
        <div
          key={i}
          className="p-6 rounded-2xl bg-(--color-surface-dark)/80 border backdrop-blur-md transition-all flex flex-col justify-between shadow-xl"
          style={{
            borderColor: isRezeMode ? "rgba(255, 0, 85, 0.3)" : "var(--color-border-dark)",
            borderTopWidth: "4px",
            borderTopColor: isRezeMode ? "#ff0055" : "#00ffcc",
          }}
        >
          <div>
            <span
              className="text-2xl font-black font-mono mb-2 block"
              style={{ color: isRezeMode ? "#c6ff00" : "#ffcc00" }}
            >
              {st.num}
            </span>
            <h4 className="text-lg font-bold text-(--color-text-dark) mb-2 uppercase font-mono">
              {st.name}
            </h4>
            <p className="text-xs text-(--color-muted-text-dark) leading-relaxed mb-4">{st.detail}</p>
          </div>
          <div className="pt-3 border-t border-(--color-border-dark) flex justify-between items-center">
            <span className="text-[10px] font-mono text-(--color-text-dark) font-semibold uppercase">Protocol Rule</span>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: isRezeMode ? "#ff0055" : "#00ffcc" }}
            >
              {st.rule}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Slide 9: Bio Slide (Admin Clearance Profile)
const BioSlide = ({ slide, isActive, isRezeMode }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] transition-all duration-700 max-w-5xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <div className="w-full grid md:grid-cols-2 gap-8 items-center">
      {/* Left Details */}
      <div
        className="p-8 rounded-3xl bg-(--color-surface-dark)/80 border backdrop-blur-md shadow-2xl flex flex-col justify-between"
        style={{
          borderColor: isRezeMode ? "#ff0055" : "var(--color-border-dark)",
          borderLeftWidth: "5px",
          borderLeftColor: isRezeMode ? "#ff0055" : "#00ffcc",
        }}
      >
        <div>
          <span
            className="text-xs font-mono uppercase tracking-widest font-bold px-3 py-1 rounded border inline-block mb-3"
            style={{
              backgroundColor: isRezeMode ? "rgba(255, 0, 85, 0.15)" : "rgba(0, 255, 204, 0.1)",
              borderColor: isRezeMode ? "#ff0055" : "#00ffcc",
              color: isRezeMode ? "#ff0055" : "#00ffcc",
            }}
          >
            {slide.title || "CLEARANCE LEVEL: ADMIN"}
          </span>
          <h3
            className={`text-4xl font-black mb-1 uppercase ${
              isRezeMode ? "text-[#ff0055]" : "text-[#00ffcc]"
            }`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {slide.name}
          </h3>
          <p className="text-xs font-mono text-(--color-muted-text-dark) mb-6">{slide.role}</p>
          <ul className="space-y-3">
            {slide.details.map((d, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-(--color-muted-text-dark) leading-relaxed">
                <span
                  className="font-bold shrink-0"
                  style={{ color: isRezeMode ? "#ff0055" : "#00ffcc" }}
                >
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
              borderColor: "rgba(255, 255, 255, 0.1)",
              color: isRezeMode ? "#c6ff00" : "#ffcc00",
            }}
          >
            {slide.jackpot}
          </div>
        )}
      </div>

      {/* Right Photo Zone */}
      <div
        className="p-4 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden bg-(--color-surface-dark)/40 text-center shadow-2xl"
        style={{
          borderColor: isRezeMode ? "#ff0055" : "var(--color-primary, #00ffcc)",
        }}
      >
        <img
          src={slide.image || "/assets/images/shug_headshot.jpg"}
          alt={slide.name}
          className="w-full h-full max-h-[360px] object-cover rounded-2xl grayscale-10 hover:grayscale-0 transition-all duration-500"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div className="z-10 flex flex-col items-center gap-2 text-(--color-text-dark) font-mono text-xs uppercase tracking-wider font-semibold mt-3">
          <EmojiIcon name="camera" className="w-5 h-5 opacity-80" />
          <span>{slide.photoZoneText || "[ DROP PORTRAIT PHOTO HERE ]"}</span>
        </div>
      </div>
    </div>
  </div>
);

// Slide 10: Workshop Lab Slide (Interactive Hands-on Lab)
const LabSlide = ({ slide, isActive, isRezeMode }) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[70vh] transition-all duration-700 max-w-5xl mx-auto px-4 ${
      isActive ? "opacity-100" : "opacity-0"
    }`}
  >
    <div className="w-full">
      <span
        className="text-xs font-mono uppercase tracking-widest font-bold px-3 py-1 rounded border inline-block mb-3"
        style={{
          backgroundColor: isRezeMode ? "rgba(255, 0, 85, 0.15)" : "rgba(0, 255, 204, 0.1)",
          borderColor: isRezeMode ? "#ff0055" : "#00ffcc",
          color: isRezeMode ? "#ff0055" : "#00ffcc",
        }}
      >
        {slide.badge || `LAB ${slide.labNumber} // INITIATE`}
      </span>
      <h2
        className={`text-4xl md:text-6xl font-black uppercase mb-3 ${
          isRezeMode ? "text-[#ff0055]" : "text-[#00ffcc]"
        }`}
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {slide.title}
      </h2>
      <p className="text-base md:text-lg text-(--color-muted-text-dark) mb-6 max-w-3xl leading-relaxed">
        {slide.description}
      </p>

      {/* Lab Terminal Box */}
      <div
        className="rounded-2xl border bg-(--color-surface-dark)/95 p-6 md:p-8 backdrop-blur-md shadow-2xl"
        style={{
          borderColor: isRezeMode ? "rgba(255, 0, 85, 0.4)" : "var(--color-border-dark)",
          borderLeftWidth: "5px",
          borderLeftColor: isRezeMode ? "#ff0055" : "var(--color-primary, #00ffcc)",
        }}
      >
        <p className="text-(--color-text-dark) font-bold font-mono text-sm mb-4">
          Objective: {slide.objective}
        </p>
        <div
          className="p-4 rounded-xl font-mono text-xs md:text-sm bg-(--color-dark) border border-(--color-border-dark) space-y-2"
          style={{ color: isRezeMode ? "#ff0055" : "var(--color-primary, #00ffcc)" }}
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
            className="px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 shadow-xl flex items-center gap-2 cursor-pointer"
            style={{
              backgroundColor: isRezeMode ? "#ff0055" : "#00ffcc",
              color: "#000",
            }}
          >
            <EmojiIcon name="tools" className="w-4 h-4" />
            {slide.actionLabel || "Launch Tool →"}
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
    <h2 className="text-3xl md:text-5xl font-bold mb-4 text-[#00ffcc] text-center">
      {slide.title}
    </h2>
    <p className="text-sm text-gray-200 mb-8 text-center font-medium">{slide.subtitle}</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {slide.polls?.map((poll) => (
        <div key={poll.id} className="p-5 rounded-2xl bg-(--color-surface-dark)/80 border border-(--color-border-dark) shadow-md">
          <h4 className="text-base font-bold text-(--color-text-dark) mb-2">{poll.question}</h4>
          <p className="text-xs text-(--color-primary) italic">{poll.followUp}</p>
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
    <h2 className="text-3xl md:text-5xl font-bold mb-8 text-center text-white">
      {slide.title}
    </h2>
    {slide.quotes?.[0] && (
      <blockquote className="text-2xl font-bold italic text-[#00ffcc] mb-4 text-center">
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
    <h2 className="text-4xl md:text-6xl font-black mb-4 text-[#00ffcc]">
      {slide.title}
    </h2>
    <p className="text-base text-gray-300 mb-8">{slide.subtitle}</p>
    <Link
      to={slide.ctaLink || "/guide"}
      className="px-8 py-4 rounded-xl bg-blue-600 text-white font-bold font-mono text-sm cursor-pointer hover:bg-blue-500"
    >
      {slide.ctaText || "Open Starter Guide →"}
    </Link>
  </div>
);

// Slide: Statement (Massive bold typography, phase badge, narrative text)
const StatementSlide = ({ slide, isActive, isRezeMode, deckMeta }) => {
  const accent = isRezeMode ? "#ff0055" : (deckMeta?.accent || "#00e5ff");
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
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-widest mb-6 border transition-all"
          style={{
            backgroundColor: `${accent}15`,
            borderColor: accent,
            color: accent,
            boxShadow: `0 0 20px ${accent}25`,
          }}
        >
          {slide.phase}
        </div>
      )}

      <div className="relative w-full">
        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 uppercase whitespace-pre-line leading-none"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            color: "#ffffff",
            textShadow: `0 0 35px ${accent}40`,
          }}
        >
          {slide.title}
        </h1>
        <div
          className="absolute -inset-4 opacity-20 blur-3xl -z-10 transition-colors pointer-events-none"
          style={{ backgroundColor: accent }}
        />
      </div>

      <p className="text-lg md:text-2xl mt-2 max-w-3xl text-gray-300 leading-relaxed font-sans font-normal">
        {slide.description}
      </p>

      {slide.signature && (
        <div className="mt-10 p-4 rounded-xl border border-gray-800 bg-black/60 backdrop-blur font-mono text-sm tracking-wide">
          <div className="text-gray-300 whitespace-pre-line leading-relaxed font-semibold">
            {slide.signature}
          </div>
        </div>
      )}
    </div>
  );
};

// Slide: Comparison (Split-screen 2-column contrast for Prompts, Code Execution, and Squad Characters)
const ComparisonSlide = ({ slide, isActive, isRezeMode, deckMeta }) => {
  const accent = isRezeMode ? "#ff0055" : (deckMeta?.accent || "#00e5ff");
  const accent2 = isRezeMode ? "#c6ff00" : (deckMeta?.accentAlt || "#ffaa00");

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
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-widest mb-3 border transition-all"
            style={{
              backgroundColor: `${accent}15`,
              borderColor: accent,
              color: accent,
            }}
          >
            {slide.phase}
          </div>
        )}
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
          {slide.title}
        </h2>
        {slide.description && (
          <p className="text-sm md:text-base text-gray-400 mt-2 max-w-2xl">
            {slide.description}
          </p>
        )}
      </div>

      {/* 2-Column Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {cards.map((card, idx) => {
          const isBad = card.type === "bad";
          const isGood = card.type === "good";

          return (
            <div
              key={idx}
              className={`flex flex-col justify-between p-6 rounded-2xl border transition-all ${
                isBad
                  ? "border-t-4 border-t-red-500 border-red-500/20 bg-red-950/10"
                  : isGood
                  ? "border-t-4 bg-black/40 backdrop-blur shadow-xl"
                  : "border-gray-800 bg-(--color-surface-dark)/60 backdrop-blur"
              }`}
              style={{
                borderTopColor: isGood ? accent : isBad ? "#ef4444" : undefined,
                boxShadow: isGood ? `0 0 35px ${accent}20` : undefined,
              }}
            >
              <div>
                {/* Character Header */}
                {card.character && (
                  <div
                    className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider mb-2"
                    style={{ color: accent2 }}
                  >
                    {card.character}
                  </div>
                )}

                {/* Narrative / Description */}
                {card.narrative && (
                  <p className="text-xs md:text-sm text-gray-300 leading-relaxed mb-4">
                    {card.narrative}
                  </p>
                )}

                {/* Tag Badge */}
                {card.tag && (
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-mono text-xs font-bold uppercase mb-3 border ${
                      isBad
                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                        : isGood
                        ? "border"
                        : "bg-gray-800 text-gray-300 border-gray-700"
                    }`}
                    style={
                      isGood
                        ? {
                            backgroundColor: `${accent}20`,
                            borderColor: `${accent}40`,
                            color: accent,
                          }
                        : undefined
                    }
                  >
                    {card.tag}
                  </div>
                )}

                {/* Content Box or BoxContent */}
                {(card.content || card.boxContent) && (
                  <div
                    className={`p-4 rounded-xl bg-black/60 border text-gray-200 font-mono text-xs md:text-sm leading-relaxed whitespace-pre-wrap overflow-x-auto ${
                      isBad
                        ? "border-red-900/40 text-gray-300"
                        : isGood
                        ? ""
                        : "border-gray-800 text-gray-300"
                    }`}
                    style={isGood ? { borderColor: `${accent}30` } : undefined}
                  >
                    {card.content || card.boxContent}
                  </div>
                )}
              </div>

              {/* Result Footer */}
              {card.result && (
                <p
                  className={`mt-4 text-xs font-mono italic ${
                    isBad ? "text-red-400" : ""
                  }`}
                  style={isGood ? { color: accent } : undefined}
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

const SlideComponents = {
  title: TitleSlide,
  statement: StatementSlide,
  comparison: ComparisonSlide,
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

export const WorkshopSlides = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Active deck selection
  const validDeckIds = [
    "nomad",
    "ripcord",
    "iron",
    "combined",
    "lhm",
    "keynote",
    "master",
    "lightning",
    "workshop",
    "devfest",
    "pride",
    "reacher",
    "chainsaw",
  ];
  const activeDeckId = deckId && validDeckIds.includes(deckId) ? deckId : DEFAULT_DECK_ID;
  const currentDeck = getDeck(activeDeckId);
  const allDecks = getAllDecks();

  const slides = currentDeck.slides;
  const presenterNotes = currentDeck.presenterNotes || {};

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
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

  // Reset slide index when deck changes
  useEffect(() => {
    setCurrentSlide(0);
  }, [activeDeckId]);

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
      } else if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key === "1") {
        navigate("/slides/nomad");
      } else if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key === "2") {
        navigate("/slides/ripcord");
      } else if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key === "3") {
        navigate("/slides/iron");
      } else if (!e.metaKey && !e.ctrlKey && !e.altKey && (e.key === "4" || e.key === "c" || e.key === "C")) {
        navigate("/slides/combined");
      } else if (e.key === "Home") {
        goToSlide(0);
      } else if (e.key === "End") {
        goToSlide(slides.length - 1);
      } else if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, toggleFullscreen, isFullscreen, goToSlide, slides.length, handlePrint, navigate]);

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

  const slide = slides[currentSlide] || slides[0];
  const SlideComponent = SlideComponents[slide.type] || TitleSlide;
  const progress = ((currentSlide + 1) / slides.length) * 100;

  const currentAccent = currentDeck.meta?.accent || "var(--color-primary, #00ffcc)";
  const accentColor = isRezeMode ? "#ff0055" : currentAccent;
  const bgGrid = isRezeMode
    ? "linear-gradient(rgba(255, 0, 85, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 0, 85, 0.08) 1px, transparent 1px)"
    : "linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)";

  return (
    <div
      ref={containerRef}
      className={`min-h-screen flex flex-col relative overflow-hidden select-none transition-colors duration-500 ${
        isRezeMode ? "reze-mode" : ""
      }`}
      style={{
        backgroundColor: isRezeMode ? "#0a0004" : "var(--color-dark, #050606)",
        color: isRezeMode ? "#e0e0e0" : "var(--color-text-dark, #e0e0e0)",
        backgroundImage: bgGrid,
        backgroundSize: "40px 40px",
        fontFamily: "'Space Grotesk', sans-serif",
      }}
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
            ← <span>Guide</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1 text-(--color-muted-text-dark) font-mono">
            <span style={{ color: accentColor }} className="font-bold">
              Deck:
            </span>
            <span className="text-(--color-text-dark) font-semibold">{currentDeck.meta.title}</span>
          </div>
        </div>

        {/* Deck Selector Pills */}
        <div className="flex items-center gap-1 bg-(--color-surface-dark)/80 p-1 rounded-xl border border-(--color-border-dark) overflow-x-auto max-w-2xl">
          {/* Main Masterclass Variants */}
          {[
            { id: "nomad", label: "1: NOMAD", color: "#00e5ff" },
            { id: "ripcord", label: "2: RIPCORD", color: "#ff0055" },
            { id: "iron", label: "3: IRON", color: "#d32f2f" },
            { id: "combined", label: "4: COMBINED", color: "#00e5ff" },
          ].map((v) => {
            const isCurrent =
              activeDeckId === v.id ||
              (v.id === "combined" && (activeDeckId === "keynote" || activeDeckId === "master")) ||
              (v.id === "nomad" && activeDeckId === "reacher") ||
              (v.id === "ripcord" && activeDeckId === "chainsaw");
            return (
              <button
                key={v.id}
                onClick={() => navigate(`/slides/${v.id}`)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isCurrent
                    ? "text-black font-black shadow-md"
                    : "text-(--color-muted-text-dark) hover:text-white"
                }`}
                style={{
                  backgroundColor: isCurrent ? v.color : "transparent",
                }}
                title={`Switch to ${v.label} (Hotkey ${v.label[0]})`}
              >
                {v.label}
              </button>
            );
          })}

          <div className="w-[1px] h-4 bg-(--color-border-dark) mx-1 shrink-0" />

          {/* Additional workshop decks */}
          {allDecks
            .filter((d) => !["nomad", "ripcord", "iron", "combined"].includes(d.id))
            .map((d) => {
              const isCurrent = activeDeckId === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => navigate(`/slides/${d.id}`)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isCurrent
                      ? "text-(--color-primary-text) font-bold bg-(--color-surface-hover-dark)"
                      : "text-(--color-muted-text-dark) hover:text-(--color-text-dark)"
                  }`}
                  style={{
                    color: isCurrent ? accentColor : undefined,
                  }}
                >
                  {d.id.toUpperCase()}
                </button>
              );
            })}
        </div>

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

      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-30">
        <div
          className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] rounded-full filter blur-[140px] transition-colors duration-700"
          style={{
            backgroundColor: isRezeMode ? "#ff0055" : "#00ffcc",
          }}
        />
        <div
          className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] rounded-full filter blur-[140px] transition-colors duration-700"
          style={{
            backgroundColor: isRezeMode ? "#c6ff00" : "#ffcc00",
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
              deckMeta={currentDeck.meta}
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
          <div className="mt-3 pt-2 border-t border-(--color-border-dark) text-[10px] text-(--color-muted-text-dark) font-mono font-medium">
            Shortcuts: 1/2/3/4 Switch Deck &bull; N Notes &bull; P PDF &bull; F Fullscreen &bull; T Timer
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
            ←
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
            →
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
                backgroundColor: i === currentSlide ? accentColor : "var(--color-border-dark, #4b5563)",
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
