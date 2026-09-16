import { useState, useReducer, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import portfolioData from "../data/portfolioData";
import { Checkmark, Close, Download, EmojiIcon } from "../components/Icons";

// Native Web Audio API parametric sound generator (Zero external MP3 dependencies)
const playTacticalBeep = (freq = 880, duration = 0.15) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    // Audio context may be restricted by autoplay policy
    console.debug("[AUDIENCE OF ONE] Web Audio notice:", err);
  }
};

// Pomidor Timer Reducer
const initialPomidor = {
  timeLeft: 25 * 60,
  isRunning: false,
  mode: "work", // "work" | "break"
  rounds: 0,
};

const pomidorReducer = (state, action) => {
  switch (action.type) {
    case "TICK":
      if (state.timeLeft <= 1) {
        const nextMode = state.mode === "work" ? "break" : "work";
        const nextTime = nextMode === "work" ? 25 * 60 : 5 * 60;
        playTacticalBeep(nextMode === "work" ? 880 : 520, 0.3);
        return {
          ...state,
          mode: nextMode,
          timeLeft: nextTime,
          rounds: nextMode === "work" ? state.rounds + 1 : state.rounds,
        };
      }
      return { ...state, timeLeft: state.timeLeft - 1 };
    case "TOGGLE":
      return { ...state, isRunning: !state.isRunning };
    case "RESET":
      return {
        ...state,
        timeLeft: state.mode === "work" ? 25 * 60 : 5 * 60,
        isRunning: false,
      };
    case "SWITCH_MODE":
      return {
        ...state,
        mode: action.payload,
        timeLeft: action.payload === "work" ? 25 * 60 : 5 * 60,
        isRunning: false,
      };
    default:
      return state;
  }
};

export const OperativesPage = () => {
  const [activeTab, setActiveTab] = useState("prebuilt");
  const [selectedOperativeId, setSelectedOperativeId] = useState(
    portfolioData.operatives?.[0]?.id ?? "bank-csv-parser"
  );

  // --- Operative 1: Bank CSV Parser State ---
  const [csvInput, setCsvInput] = useState(
    `Date,Category,Description,Amount\n2026-09-01,Groceries,Trader Joes,-84.20\n2026-09-02,Utilities,DTE Energy,-142.50\n2026-09-03,Dining,Detroit Shawarma,-24.00\n2026-09-05,Groceries,Whole Foods,-62.15\n2026-09-07,Income,Client Direct Deposit,2400.00\n2026-09-08,Coffee,Roasting Plant,-6.50\n2026-09-10,Dining,Green Dot Stables,-38.40`
  );
  const [csvSummary, setCsvSummary] = useState(null);

  const runCsvParser = () => {
    try {
      const lines = csvInput.trim().split("\n");
      if (lines.length < 2) return;
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const catIdx = headers.indexOf("category");
      const amtIdx = headers.indexOf("amount");

      const totals = {};
      let totalExpense = 0;
      let totalIncome = 0;

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",").map((r) => r.trim());
        if (row.length < 2) continue;
        const cat = catIdx !== -1 ? row[catIdx] || "Uncategorized" : "General";
        const rawAmt = amtIdx !== -1 ? parseFloat(row[amtIdx]) : parseFloat(row[row.length - 1]);
        const amt = isNaN(rawAmt) ? 0 : rawAmt;

        if (amt < 0) {
          totals[cat] = (totals[cat] || 0) + Math.abs(amt);
          totalExpense += Math.abs(amt);
        } else {
          totalIncome += amt;
        }
      }

      setCsvSummary({ totals, totalExpense, totalIncome });
      playTacticalBeep(660, 0.1);
    } catch (err) {
      console.error("CSV parse error:", err);
    }
  };

  // --- Operative 2: School Email Digest State ---
  const [emailText, setEmailText] = useState(
    `Dear Parents,\n\nWelcome to Week 4 of Fall Semester! Please review the key items below:\n- Field Trip permission slip and \$15 fee due by September 22.\n- Picture Day will be held on October 3. Formal uniforms required.\n- Parent-Teacher Conferences scheduled for October 14 from 4pm to 7pm.\n- Book Fair orders due on October 18.\n\nThank you for supporting our school!`
  );
  const [extractedDeadlines, setExtractedDeadlines] = useState(null);

  const runEmailScraper = () => {
    const lines = emailText.split("\n");
    const extracted = [];
    const datePattern =
      /(?:due by|on|held on|scheduled for|by)\s+([A-Za-z]+ \d{1,2}|\d{1,2}\/\d{1,2})/gi;

    lines.forEach((line) => {
      const match = [...line.matchAll(datePattern)];
      if (match.length > 0) {
        extracted.push({
          raw: line.replace(/^[-*•]\s*/, "").trim(),
          dateKey: match[0][1],
        });
      }
    });

    setExtractedDeadlines(extracted);
    playTacticalBeep(740, 0.1);
  };

  // --- Operative 3: Meal Prep Compiler State ---
  const [bodyweightKg, setBodyweightKg] = useState(85);
  const [proteinRatio, setProteinRatio] = useState(2.2);

  const targetProteinGrams = Math.round(bodyweightKg * proteinRatio);
  const chickenGramsDaily = Math.round((targetProteinGrams * 0.6) / 0.31); // 31g protein per 100g chicken
  const eggWhitesGramsDaily = Math.round((targetProteinGrams * 0.4) / 0.11); // 11g protein per 100g egg whites

  // --- Operative 4: Pomidor Focus Timer ---
  const [pomidorState, dispatchPomidor] = useReducer(
    pomidorReducer,
    initialPomidor
  );

  useEffect(() => {
    let timer;
    if (pomidorState.isRunning) {
      timer = setInterval(() => dispatchPomidor({ type: "TICK" }), 1000);
    }
    return () => clearInterval(timer);
  }, [pomidorState.isRunning]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // --- Operative 5: Criminal Cookies Localized Cart ---
  const [cartItems, setCartItems] = useState([
    { id: "cookie-reacher", name: "The Reacher Batch (High Protein)", price: 4.5, qty: 2 },
    { id: "cookie-chainsaw", name: "Division 4 Espresso Chunk", price: 4.0, qty: 1 },
  ]);

  const addCartItem = (item) => {
    setCartItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...item, qty: 1 }];
    });
    playTacticalBeep(520, 0.08);
  };

  const removeCartItem = (id) => {
    setCartItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const cartTotal = cartItems.reduce((acc, i) => acc + i.price * i.qty, 0);

  // --- Custom Operative Blueprint Creator ---
  const [customName, setCustomName] = useState("Bespoke Daily Utility");
  const [customRuntime, setCustomRuntime] = useState("Python 3 Native");
  const [customFriction, setCustomFriction] = useState(
    "Automating messy daily data sorting without third-party subscriptions"
  );
  const [customPrompt, setCustomPrompt] = useState(
    "Target: Python 3 script.\nGoal: Read unstructured input and output sorted JSON.\nConstraints: Native standard libraries only, zero external packages. Execute."
  );
  const [copiedBlueprint, setCopiedBlueprint] = useState(false);

  // Neagley Zero-Bloat Constraint Auditor
  const bloatKeywords = [
    "axios",
    "moment",
    "lodash",
    "npm install",
    "pip install",
    "redux",
    "webpack",
    "jquery",
  ];
  const detectedBloat = bloatKeywords.filter((k) =>
    customPrompt.toLowerCase().includes(k)
  );
  const isZeroBloat = detectedBloat.length === 0;

  const handleCopyBlueprint = () => {
    const blueprint = `# AUDIENCE OF ONE OPERATIVE BLUEPRINT: ${customName.toUpperCase()}
# ARCHETYPE: Neagley & Reacher (Zero-Bloat Sovereign Agent)

## TARGET RUNTIME: ${customRuntime}
## ACUTE FRICTION: ${customFriction}

### CONSTRAINTS:
1. Native runtime standard libraries only. Zero external dependencies.
2. 100% offline verifiable execution.
3. Output diffs or single-file executable.

### MASTER PROMPT:
\`\`\`
${customPrompt}
\`\`\`

Generated via DevFest Sovereign Sandbox.
¯\\_(ツ)_/¯ jackpot ¯\\_(ツ)_/¯
`;
    navigator.clipboard.writeText(blueprint).then(() => {
      setCopiedBlueprint(true);
      setTimeout(() => setCopiedBlueprint(false), 2500);
      playTacticalBeep(880, 0.1);
    });
  };

  const selectedOperative =
    portfolioData.operatives?.find((o) => o.id === selectedOperativeId) ||
    portfolioData.operatives?.[0];

  return (
    <div className="min-h-screen bg-[#05070a] text-[#f4f4f5] font-sans selection:bg-[#ff0055] selection:text-white pb-20">
      {/* Top Banner / Tactical HUD */}
      <section className="border-b border-[#1f2430] bg-[#090d14]/80 backdrop-blur-md px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ff0055]/15 border border-[#ff0055] rounded text-xs uppercase tracking-widest text-[#ff0055] font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-[#ff0055] animate-ping" />
              THE REACHER PROTOCOL // AUDIENCE OF ONE
            </div>
            <div className="text-xs font-mono text-gray-400">
              SPEED OF THOUGHT // ZERO-BLOAT SANDBOX
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white font-mono">
            Sovereign Operatives
          </h1>
          <p className="text-base md:text-lg text-gray-300 max-w-3xl leading-relaxed">
            The syntax barrier is dead. The most valuable software you can build
            is for an <span className="text-[#00ffcc] font-bold">Audience of One: You</span>.
            Run live personal operatives below, test zero-bloat constraints, or assemble
            and export your own bespoke agent blueprint.
          </p>

          {/* Tab Navigation */}
          <nav
            aria-label="Operatives Sandbox Mode"
            className="flex flex-wrap items-center gap-2 pt-4"
          >
            <button
              id="tab-prebuilt"
              type="button"
              onClick={() => setActiveTab("prebuilt")}
              aria-selected={activeTab === "prebuilt"}
              className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc] cursor-pointer ${
                activeTab === "prebuilt"
                  ? "bg-[#00ffcc] text-black shadow-[0_0_15px_rgba(0,255,204,0.3)]"
                  : "bg-[#121721] text-gray-400 hover:text-white border border-[#1f2430]"
              }`}
            >
              1. Live Operatives Showcase
            </button>
            <button
              id="tab-sandbox"
              type="button"
              onClick={() => setActiveTab("sandbox")}
              aria-selected={activeTab === "sandbox"}
              className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc] cursor-pointer ${
                activeTab === "sandbox"
                  ? "bg-[#00ffcc] text-black shadow-[0_0_15px_rgba(0,255,204,0.3)]"
                  : "bg-[#121721] text-gray-400 hover:text-white border border-[#1f2430]"
              }`}
            >
              2. Custom Blueprint Builder
            </button>
            <Link
              to="/slides/workshop"
              className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider text-gray-400 hover:text-[#00ffcc] transition-colors border border-transparent hover:border-[#1f2430] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc]"
            >
              Workshop Deck &rarr;
            </Link>
          </nav>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 pt-8">
        {activeTab === "prebuilt" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Operatives Selector List */}
            <aside className="lg:col-span-4 space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">
                Select Personal Operative
              </h2>
              {portfolioData.operatives?.map((op) => {
                const isSelected = op.id === selectedOperativeId;
                return (
                  <button
                    key={op.id}
                    id={`op-select-${op.id}`}
                    type="button"
                    onClick={() => {
                      setSelectedOperativeId(op.id);
                      playTacticalBeep(580, 0.05);
                    }}
                    aria-label={`Select ${op.name}`}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc] ${
                      isSelected
                        ? "bg-[#0f1724] border-[#00ffcc] text-white shadow-[0_0_15px_rgba(0,255,204,0.15)]"
                        : "bg-[#090d14] border-[#1f2430] text-gray-400 hover:text-gray-200 hover:border-gray-700"
                    }`}
                  >
                    <div className="text-xs font-mono text-[#00ffcc] uppercase mb-1">
                      {op.character}
                    </div>
                    <div className="font-bold text-sm text-white mb-1">
                      {op.name}
                    </div>
                    <div className="text-xs text-gray-400 line-clamp-2">
                      {op.problem}
                    </div>
                  </button>
                );
              })}
            </aside>

            {/* Interactive Operative Runner */}
            <section className="lg:col-span-8 bg-[#0a0e17] border border-[#1f2430] rounded-2xl p-6 md:p-8 space-y-6">
              {selectedOperative && (
                <>
                  <header className="border-b border-[#1f2430] pb-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#00ffcc]/10 border border-[#00ffcc]/30 text-[#00ffcc] font-bold">
                        {selectedOperative.target}
                      </span>
                      <span className="text-xs font-mono text-gray-400">
                        {selectedOperative.character}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black uppercase text-white font-mono">
                      {selectedOperative.name}
                    </h2>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {selectedOperative.problem}
                    </p>
                  </header>

                  {/* SPECIFIC INTERACTIVE DEMOS */}

                  {/* 1. BANK CSV PARSER */}
                  {selectedOperative.id === "bank-csv-parser" && (
                    <article className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="csv-textarea"
                          className="text-xs font-mono text-gray-300 uppercase tracking-wider"
                        >
                          Simulated Bank CSV Input (Zero External Deps):
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setCsvInput(
                              `Date,Category,Description,Amount\n2026-09-01,Groceries,Meijer,-124.50\n2026-09-02,Gym,Metro Fitness,-75.00\n2026-09-03,Dining,Astro Coffee,-14.25\n2026-09-04,Income,Dev Consulting,3200.00\n2026-09-05,Groceries,Eastern Market,-48.00`
                            );
                            playTacticalBeep(600, 0.05);
                          }}
                          className="text-xs font-mono text-[#00ffcc] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00ffcc] rounded px-1"
                        >
                          [ Reload Alternate CSV ]
                        </button>
                      </div>

                      <textarea
                        id="csv-textarea"
                        rows={6}
                        value={csvInput}
                        onChange={(e) => setCsvInput(e.target.value)}
                        className="w-full bg-[#05070a] border border-[#1f2430] rounded-xl p-3 font-mono text-xs text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc]"
                      />

                      <button
                        type="button"
                        onClick={runCsvParser}
                        className="px-5 py-2.5 bg-[#00ffcc] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#33ffdd] transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,204,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc]"
                      >
                        Execute Ledger Deduction &rarr;
                      </button>

                      {csvSummary && (
                        <div className="p-4 bg-black/60 border border-[#00ffcc]/40 rounded-xl space-y-3 font-mono text-xs">
                          <div className="text-[#00ffcc] font-bold uppercase tracking-widest">
                            // Deductive Expense Breakdown
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-gray-300">
                            {Object.entries(csvSummary.totals).map(([cat, val]) => (
                              <div
                                key={cat}
                                className="flex justify-between border-b border-gray-800 pb-1"
                              >
                                <span>{cat}:</span>
                                <span className="font-bold text-white">
                                  ${val.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-700 font-bold text-sm">
                            <span className="text-red-400">
                              Total Burn: ${csvSummary.totalExpense.toFixed(2)}
                            </span>
                            <span className="text-green-400">
                              Total Income: ${csvSummary.totalIncome.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </article>
                  )}

                  {/* 2. SCHOOL EMAIL SCRAPER */}
                  {selectedOperative.id === "school-email-scraper" && (
                    <article className="space-y-4">
                      <label
                        htmlFor="email-textarea"
                        className="text-xs font-mono text-gray-300 uppercase tracking-wider block"
                      >
                        School Newsletter Body (Raw Unstructured Text):
                      </label>
                      <textarea
                        id="email-textarea"
                        rows={6}
                        value={emailText}
                        onChange={(e) => setEmailText(e.target.value)}
                        className="w-full bg-[#05070a] border border-[#1f2430] rounded-xl p-3 font-mono text-xs text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc]"
                      />
                      <button
                        type="button"
                        onClick={runEmailScraper}
                        className="px-5 py-2.5 bg-[#00ffcc] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#33ffdd] transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,204,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc]"
                      >
                        Extract Deadlines &amp; Dates &rarr;
                      </button>

                      {extractedDeadlines && (
                        <div className="p-4 bg-black/60 border border-[#00ffcc]/40 rounded-xl space-y-2 font-mono text-xs">
                          <div className="text-[#00ffcc] font-bold uppercase tracking-widest">
                            // Extracted Action Signals ({extractedDeadlines.length})
                          </div>
                          {extractedDeadlines.length === 0 ? (
                            <p className="text-gray-400">No deadline signals found.</p>
                          ) : (
                            <ul className="space-y-2">
                              {extractedDeadlines.map((item, idx) => (
                                <li
                                  key={idx}
                                  className="p-2 bg-[#090d14] rounded border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-2"
                                >
                                  <span className="text-gray-300">{item.raw}</span>
                                  <span className="px-2 py-0.5 bg-[#00ffcc]/20 text-[#00ffcc] rounded text-[10px] font-bold shrink-0 self-start md:self-auto">
                                    {item.dateKey}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </article>
                  )}

                  {/* 3. MEAL PREP COMPILER */}
                  {selectedOperative.id === "meal-prep-compiler" && (
                    <article className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="bw-input"
                            className="text-xs font-mono text-gray-300 uppercase tracking-wider block mb-1"
                          >
                            Bodyweight ({bodyweightKg} kg / {(bodyweightKg * 2.20462).toFixed(0)} lbs):
                          </label>
                          <input
                            id="bw-input"
                            type="range"
                            min="50"
                            max="140"
                            value={bodyweightKg}
                            onChange={(e) => setBodyweightKg(Number(e.target.value))}
                            className="w-full accent-[#00ffcc]"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="protein-ratio"
                            className="text-xs font-mono text-gray-300 uppercase tracking-wider block mb-1"
                          >
                            Protein Target: {proteinRatio} g / kg
                          </label>
                          <input
                            id="protein-ratio"
                            type="range"
                            min="1.6"
                            max="3.0"
                            step="0.1"
                            value={proteinRatio}
                            onChange={(e) => setProteinRatio(Number(e.target.value))}
                            className="w-full accent-[#00ffcc]"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-black/60 border border-[#00ffcc]/40 rounded-xl space-y-3 font-mono text-xs">
                        <div className="text-[#00ffcc] font-bold uppercase tracking-widest">
                          // Daily Whole Food Compiling
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-[#090d14] rounded border border-gray-800">
                            <span className="text-gray-400 block">Total Daily Protein:</span>
                            <span className="text-xl font-bold text-white">
                              {targetProteinGrams} g
                            </span>
                          </div>
                          <div className="p-3 bg-[#090d14] rounded border border-gray-800">
                            <span className="text-gray-400 block">Chicken Breast:</span>
                            <span className="text-xl font-bold text-[#c6ff00]">
                              {chickenGramsDaily} g / day
                            </span>
                          </div>
                          <div className="p-3 bg-[#090d14] rounded border border-gray-800">
                            <span className="text-gray-400 block">Liquid Egg Whites:</span>
                            <span className="text-xl font-bold text-[#00ffcc]">
                              {eggWhitesGramsDaily} g / day
                            </span>
                          </div>
                        </div>
                        <div className="text-gray-400 text-[11px] pt-1 border-t border-gray-800">
                          Weekly Grocery Target: {((chickenGramsDaily * 7) / 1000).toFixed(2)} kg chicken breast &bull; {((eggWhitesGramsDaily * 7) / 1000).toFixed(2)} kg egg whites.
                        </div>
                      </div>
                    </article>
                  )}

                  {/* 4. POMIDOR TIMER */}
                  {selectedOperative.id === "pomidor-micro-loop" && (
                    <article className="space-y-4 text-center">
                      <div className="inline-flex gap-2 p-1 bg-black rounded-lg border border-[#1f2430]">
                        <button
                          type="button"
                          onClick={() => dispatchPomidor({ type: "SWITCH_MODE", payload: "work" })}
                          className={`px-3 py-1 rounded text-xs font-mono uppercase font-bold transition-all ${
                            pomidorState.mode === "work"
                              ? "bg-[#ff0055] text-white"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Work (25m)
                        </button>
                        <button
                          type="button"
                          onClick={() => dispatchPomidor({ type: "SWITCH_MODE", payload: "break" })}
                          className={`px-3 py-1 rounded text-xs font-mono uppercase font-bold transition-all ${
                            pomidorState.mode === "break"
                              ? "bg-[#00ffcc] text-black"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Break (5m)
                        </button>
                      </div>

                      <div className="text-6xl md:text-7xl font-mono font-black tracking-tight text-white py-4">
                        {formatTime(pomidorState.timeLeft)}
                      </div>

                      <div className="flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            dispatchPomidor({ type: "TOGGLE" });
                            playTacticalBeep(pomidorState.isRunning ? 440 : 880, 0.1);
                          }}
                          className={`px-6 py-2.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                            pomidorState.isRunning
                              ? "bg-red-500 text-white"
                              : "bg-[#00ffcc] text-black hover:bg-[#33ffdd]"
                          }`}
                        >
                          {pomidorState.isRunning ? "Pause" : "Start Focus"}
                        </button>
                        <button
                          type="button"
                          onClick={() => dispatchPomidor({ type: "RESET" })}
                          className="px-4 py-2.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>

                      <div className="text-xs font-mono text-gray-400">
                        Rounds Completed Today: {pomidorState.rounds}
                      </div>
                    </article>
                  )}

                  {/* 5. CRIMINAL COOKIES CART */}
                  {selectedOperative.id === "criminal-cookies-cart" && (
                    <article className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            addCartItem({
                              id: `cookie-${Date.now()}`,
                              name: "Specialty Batch Cookie",
                              price: 4.5,
                            })
                          }
                          className="px-3 py-2 bg-[#121721] border border-[#00ffcc]/40 text-[#00ffcc] rounded-lg font-mono text-xs font-bold hover:bg-[#00ffcc] hover:text-black transition-all cursor-pointer"
                        >
                          + Quick Add Specialty Cookie ($4.50)
                        </button>
                      </div>

                      <div className="p-4 bg-black/60 border border-[#1f2430] rounded-xl space-y-2 font-mono text-xs">
                        <div className="flex justify-between text-[#00ffcc] font-bold uppercase tracking-widest pb-2 border-b border-gray-800">
                          <span>Item</span>
                          <span>Qty / Subtotal</span>
                        </div>
                        {cartItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-gray-300 py-1"
                          >
                            <span>{item.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">
                                {item.qty} &times; ${item.price.toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeCartItem(item.id)}
                                className="text-red-400 hover:text-red-300 px-1 font-bold"
                              >
                                &minus;
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="pt-3 border-t border-gray-800 flex justify-between font-bold text-sm text-white">
                          <span>Total (0% Third-party telemetry):</span>
                          <span className="text-[#00ffcc]">${cartTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </article>
                  )}

                  {/* Architectural Blueprint Info & Prompt Box */}
                  <div className="pt-4 border-t border-[#1f2430] space-y-3">
                    <div className="text-xs font-mono uppercase tracking-widest text-[#00ffcc] font-bold">
                      // The Master Constraint Prompt:
                    </div>
                    <pre className="p-4 bg-black/80 border border-gray-800 rounded-xl text-xs font-mono text-gray-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                      {selectedOperative.samplePrompt}
                    </pre>

                    <div className="text-xs font-mono uppercase tracking-widest text-gray-400 font-bold">
                      // Implementation Snippet:
                    </div>
                    <pre className="p-4 bg-black/80 border border-gray-800 rounded-xl text-xs font-mono text-gray-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                      {selectedOperative.sampleCode}
                    </pre>
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {/* Custom Blueprint Creator Tab */}
        {activeTab === "sandbox" && (
          <section className="bg-[#0a0e17] border border-[#1f2430] rounded-2xl p-6 md:p-10 space-y-8 max-w-4xl mx-auto">
            <header className="border-b border-[#1f2430] pb-4">
              <h2 className="text-2xl font-black uppercase text-white font-mono">
                Audience of One Blueprint Architect
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed mt-1">
                Draft strict constraints for your personal agent. Run the Neagley
                Zero-Bloat audit to ensure no unnecessary dependencies are pulled.
              </p>
            </header>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="custom-name-input"
                    className="text-xs font-mono text-gray-300 uppercase tracking-wider block mb-1"
                  >
                    Operative Name:
                  </label>
                  <input
                    id="custom-name-input"
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-[#05070a] border border-[#1f2430] rounded-xl p-3 font-mono text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="custom-runtime-input"
                    className="text-xs font-mono text-gray-300 uppercase tracking-wider block mb-1"
                  >
                    Target Runtime:
                  </label>
                  <input
                    id="custom-runtime-input"
                    type="text"
                    value={customRuntime}
                    onChange={(e) => setCustomRuntime(e.target.value)}
                    className="w-full bg-[#05070a] border border-[#1f2430] rounded-xl p-3 font-mono text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="custom-friction-input"
                  className="text-xs font-mono text-gray-300 uppercase tracking-wider block mb-1"
                >
                  Acute Personal Friction Point:
                </label>
                <input
                  id="custom-friction-input"
                  type="text"
                  value={customFriction}
                  onChange={(e) => setCustomFriction(e.target.value)}
                  className="w-full bg-[#05070a] border border-[#1f2430] rounded-xl p-3 font-mono text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="custom-prompt-input"
                    className="text-xs font-mono text-gray-300 uppercase tracking-wider"
                  >
                    Constraint-Driven Master Prompt:
                  </label>
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex items-center gap-1.5 ${
                      isZeroBloat
                        ? "bg-green-500/20 text-green-400 border border-green-500/40"
                        : "bg-red-500/20 text-red-400 border border-red-500/40"
                    }`}
                  >
                    {isZeroBloat ? (
                      <>
                        <EmojiIcon name="checkmark" className="w-3.5 h-3.5 shrink-0" />
                        Zero-Bloat Verified
                      </>
                    ) : (
                      <>
                        <EmojiIcon name="warning" className="w-3.5 h-3.5 shrink-0" />
                        {`Faustian Dep Detected: ${detectedBloat.join(", ")}`}
                      </>
                    )}
                  </span>
                </div>
                <textarea
                  id="custom-prompt-input"
                  rows={5}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full bg-[#05070a] border border-[#1f2430] rounded-xl p-3 font-mono text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc]"
                />
                {!isZeroBloat && (
                  <p className="text-xs text-red-400 font-mono mt-1">
                    The Neagley Principle prohibits unnecessary dependencies.
                    Replace external packages with native standard APIs (e.g. fetch instead of axios).
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#1f2430]">
                <button
                  type="button"
                  onClick={handleCopyBlueprint}
                  className="px-5 py-2.5 bg-[#00ffcc] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#33ffdd] transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,204,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc]"
                >
                  {copiedBlueprint ? (
                    <span className="inline-flex items-center gap-1.5">
                      <EmojiIcon name="checkmark" className="w-4 h-4 shrink-0" />
                      Blueprint Copied
                    </span>
                  ) : (
                    "Copy Blueprint Markdown"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const dataStr =
                      "data:text/json;charset=utf-8," +
                      encodeURIComponent(
                        JSON.stringify(
                          {
                            name: customName,
                            runtime: customRuntime,
                            friction: customFriction,
                            prompt: customPrompt,
                            date: new Date().toISOString(),
                          },
                          null,
                          2
                        )
                      );
                    const downloadAnchor = document.createElement("a");
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute(
                      "download",
                      `${customName.toLowerCase().replace(/\s+/g, "_")}_blueprint.json`
                    );
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                  }}
                  className="px-5 py-2.5 bg-[#121721] text-gray-200 border border-[#1f2430] hover:bg-[#1a2130] font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc]"
                >
                  Export JSON Blueprint
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
};

export default OperativesPage;
