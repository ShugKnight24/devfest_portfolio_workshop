import { useState, useEffect } from "react";
import { EmojiIcon } from "../components/Icons/EmojiIcon";
import { Link } from "react-router-dom";

// Standard mock sessions to populate dashboard initially
const MOCK_SESSIONS = [
  {
    id: "bot-google",
    framework: "react",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    last_active: new Date(Date.now() - 3500000).toISOString(),
    botScore: 0.9,
    botSignals: { headlessUserAgent: true, defaultHeadlessScreen: true },
    behavior: { mousePaths: "linear", typingCadence: "robotic", humanScore: 0.1 },
    events: [
      { eventType: "session_start", timestamp: new Date(Date.now() - 3600000).toISOString() },
      { eventType: "page_view", eventData: { route: "/" }, timestamp: new Date(Date.now() - 3590000).toISOString() },
      { eventType: "page_view", eventData: { route: "/lessons" }, timestamp: new Date(Date.now() - 3500000).toISOString() }
    ]
  },
  {
    id: "bot-selenium",
    framework: "vanilla",
    created_at: new Date(Date.now() - 1800000).toISOString(),
    last_active: new Date(Date.now() - 1750000).toISOString(),
    botScore: 1.0,
    botSignals: { webdriver: true, headlessUserAgent: true, automationGlobals: ["__webdriver_evaluate"] },
    behavior: { mousePaths: "linear", typingCadence: "robotic", humanScore: 0.0 },
    events: [
      { eventType: "session_start", timestamp: new Date(Date.now() - 1800000).toISOString() },
      { eventType: "page_view", eventData: { route: "home" }, timestamp: new Date(Date.now() - 1790000).toISOString() },
      { eventType: "slide_nav", eventData: { slideId: "title", index: 0 }, timestamp: new Date(Date.now() - 1780000).toISOString() }
    ]
  },
  {
    id: "human-dev",
    framework: "react",
    created_at: new Date(Date.now() - 600000).toISOString(),
    last_active: new Date(Date.now() - 10000).toISOString(),
    botScore: 0.0,
    botSignals: {},
    behavior: { mousePaths: "curved", typingCadence: "varied", humanScore: 1.0 },
    events: [
      { eventType: "session_start", timestamp: new Date(Date.now() - 600000).toISOString() },
      { eventType: "page_view", eventData: { route: "/" }, timestamp: new Date(Date.now() - 590000).toISOString() },
      { eventType: "theme_changed", eventData: { theme: "oceanBreeze" }, timestamp: new Date(Date.now() - 500000).toISOString() },
      { eventType: "page_view", eventData: { route: "/lessons" }, timestamp: new Date(Date.now() - 400000).toISOString() },
      { eventType: "achievement_unlocked", eventData: { achievement: "lessonComplete" }, timestamp: new Date(Date.now() - 200000).toISOString() },
      { eventType: "slide_nav", eventData: { slideId: "overview", index: 8 }, timestamp: new Date(Date.now() - 10000).toISOString() }
    ]
  },
  {
    id: "human-designer",
    framework: "vanilla",
    created_at: new Date(Date.now() - 1200000).toISOString(),
    last_active: new Date(Date.now() - 600000).toISOString(),
    botScore: 0.1,
    botSignals: { softwareRenderer: true }, // Virtual machine check
    behavior: { mousePaths: "curved", typingCadence: "varied", humanScore: 0.9 },
    events: [
      { eventType: "session_start", timestamp: new Date(Date.now() - 1200000).toISOString() },
      { eventType: "page_view", eventData: { route: "home" }, timestamp: new Date(Date.now() - 1100000).toISOString() },
      { eventType: "theme_changed", eventData: { theme: "sunsetGlow" }, timestamp: new Date(Date.now() - 900000).toISOString() },
      { eventType: "theme_toggle_dark_mode", eventData: { isDark: true }, timestamp: new Date(Date.now() - 850000).toISOString() },
      { eventType: "page_view", eventData: { route: "showcase" }, timestamp: new Date(Date.now() - 600000).toISOString() }
    ]
  }
];

export const TelemetryDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeTab, setActiveTab] = useState("sessions"); // sessions | charts | heatmaps
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchTelemetry = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/telemetry");
        if (res.ok) {
          const data = await res.json();
          // Merge API data with local storage data and mock data
          combineData(data);
        } else {
          combineData([]);
        }
      } catch (e) {
        combineData([]);
      } finally {
        setLoading(false);
      }
    };

    const combineData = (apiData) => {
      // Load local storage sessions
      let localData = [];
      try {
        const local = localStorage.getItem("telemetry_local_sessions");
        if (local) {
          localData = Object.values(JSON.parse(local));
        }
      } catch (err) {
        console.error("Failed to parse local storage telemetry", err);
      }

      // Combine and filter duplicates by id
      const allSessionsMap = new Map();
      
      // Seed with mock data
      MOCK_SESSIONS.forEach(s => allSessionsMap.set(s.id, s));
      
      // Overwrite with API data
      apiData.forEach(s => allSessionsMap.set(s.id, s));

      // Overwrite with local storage data
      localData.forEach(s => allSessionsMap.set(s.id, s));

      // Sort by creation time desc
      const sorted = Array.from(allSessionsMap.values()).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setSessions(sorted);
      if (sorted.length > 0) {
        setSelectedSession(sorted[0]);
      }
    };

    fetchTelemetry();
  }, [refreshKey]);

  // Calculate statistics
  const totalSessions = sessions.length;
  const botSessions = sessions.filter(s => s.botScore >= 0.5).length;
  const humanSessions = totalSessions - botSessions;
  const botRatio = totalSessions > 0 ? (botSessions / totalSessions) * 100 : 0;
  const reactSessionsCount = sessions.filter(s => s.framework === "react").length;
  const vanillaSessionsCount = sessions.filter(s => s.framework === "vanilla").length;

  // Aggregate event categories
  const eventCounts = {};
  sessions.forEach(s => {
    s.events?.forEach(e => {
      eventCounts[e.eventType] = (eventCounts[e.eventType] || 0) + 1;
    });
  });

  // Calculate slide heatmap frequencies
  const slideViews = {};
  sessions.forEach(s => {
    s.events?.forEach(e => {
      if (e.eventType === "slide_nav" && e.eventData?.slideId) {
        slideViews[e.eventData.slideId] = (slideViews[e.eventData.slideId] || 0) + 1;
      }
    });
  });

  const getBotSeverityColor = (score) => {
    if (score >= 0.8) return "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/60 border-red-300 dark:border-red-800 font-bold";
    if (score >= 0.4) return "text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 font-bold";
    return "text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 font-bold";
  };

  return (
    <div className="min-h-screen bg-(--color-background) dark:bg-(--color-dark) text-(--color-text) dark:text-(--color-text-dark) py-24 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark) mb-2">
              <Link to="/dashboard" className="hover:text-(--color-primary) transition-colors font-medium">Dashboard</Link>
              <span>/</span>
              <span className="text-(--color-text) dark:text-(--color-text-dark) font-bold">Telemetry Insights</span>
            </div>
            <h1 className="text-3xl font-extrabold text-(--color-text) dark:text-(--color-text-dark) flex items-center gap-3">
              <EmojiIcon name="robot" className="w-8 h-8" />
              Telemetry &amp; Bot Detection
            </h1>
            <p className="text-(--color-muted-text) dark:text-(--color-muted-text-dark) mt-1 font-medium">
              Verify actual audience integrity and trace agentic traffic patterns in real-time.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="px-4 py-2 bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-lg shadow-sm hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark) font-semibold text-sm text-(--color-text) dark:text-(--color-text-dark) cursor-pointer flex items-center gap-2"
            >
              <EmojiIcon name="cycle" className="w-4 h-4" /> Refresh Data
            </button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) p-6 rounded-xl border border-(--color-border) dark:border-(--color-border-dark) shadow-sm">
            <p className="text-xs font-bold text-(--color-muted-text) dark:text-(--color-muted-text-dark) uppercase tracking-wider mb-1">Total Sessions</p>
            <h2 className="text-3xl font-black text-(--color-text) dark:text-(--color-text-dark)">{totalSessions}</h2>
            <div className="flex items-center gap-2 text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-semibold mt-2">
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">{reactSessionsCount} React</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">{vanillaSessionsCount} Vanilla</span>
            </div>
          </div>
          <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) p-6 rounded-xl border border-(--color-border) dark:border-(--color-border-dark) shadow-sm">
            <p className="text-xs font-bold text-(--color-muted-text) dark:text-(--color-muted-text-dark) uppercase tracking-wider mb-1">Suspected Bots</p>
            <h2 className="text-3xl font-black text-red-600 dark:text-red-400">{botSessions}</h2>
            <p className="text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-medium mt-2">Score limit: &ge; 0.50</p>
          </div>
          <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) p-6 rounded-xl border border-(--color-border) dark:border-(--color-border-dark) shadow-sm">
            <p className="text-xs font-bold text-(--color-muted-text) dark:text-(--color-muted-text-dark) uppercase tracking-wider mb-1">Human Verifications</p>
            <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{humanSessions}</h2>
            <p className="text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-medium mt-2">Low signal score: &lt; 0.50</p>
          </div>
          <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) p-6 rounded-xl border border-(--color-border) dark:border-(--color-border-dark) shadow-sm">
            <p className="text-xs font-bold text-(--color-muted-text) dark:text-(--color-muted-text-dark) uppercase tracking-wider mb-1">AI/Bot traffic ratio</p>
            <h2 className="text-3xl font-black text-purple-700 dark:text-purple-300">{botRatio.toFixed(1)}%</h2>
            {/* Simple CSS-only progress indicator */}
            <div className="w-full bg-(--color-border) dark:bg-(--color-border-dark) h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-purple-600 h-full" style={{ width: `${botRatio}%` }}></div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-(--color-border) dark:border-(--color-border-dark) mb-6 gap-2">
          <button
            onClick={() => setActiveTab("sessions")}
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === "sessions"
                ? "border-(--color-primary) text-(--color-primary)"
                : "border-transparent text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark)"
            }`}
          >
            Session Explorer
          </button>
          <button
            onClick={() => setActiveTab("charts")}
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === "charts"
                ? "border-(--color-primary) text-(--color-primary)"
                : "border-transparent text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark)"
            }`}
          >
            Integrity Statistics
          </button>
          <button
            onClick={() => setActiveTab("heatmaps")}
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === "heatmaps"
                ? "border-(--color-primary) text-(--color-primary)"
                : "border-transparent text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark)"
            }`}
          >
            Slide Heatmap
          </button>
        </div>

        {/* Tab Content: Session Explorer */}
        {activeTab === "sessions" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar list (5 cols) */}
            <div className="lg:col-span-5 bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl overflow-hidden shadow-sm flex flex-col max-h-[600px]">
              <div className="p-4 border-b border-(--color-border) dark:border-(--color-border-dark) bg-(--color-background) dark:bg-(--color-dark)/80 font-bold text-(--color-text) dark:text-(--color-text-dark) text-sm">
                Active &amp; Cached Sessions
              </div>
              <div className="overflow-y-auto divide-y divide-(--color-border) dark:divide-(--color-border-dark) flex-1">
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSession(s)}
                    className={`w-full text-left p-4 hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark) transition-colors flex justify-between items-center gap-3 cursor-pointer ${
                      selectedSession?.id === s.id ? "bg-(--color-surface-hover) dark:bg-(--color-surface-hover-dark) border-l-4 border-(--color-primary)" : ""
                    }`}
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-(--color-text) dark:text-(--color-text-dark) truncate max-w-[150px] md:max-w-[200px]">
                        {s.id}
                      </div>
                      <div className="text-[11px] text-(--color-muted-text) dark:text-(--color-muted-text-dark) mt-1 flex items-center gap-2 font-medium">
                        <span>{new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>&bull;</span>
                        <span className="capitalize">{s.framework} Starter</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBotSeverityColor(s.botScore)}`}>
                        {s.botScore >= 0.5 ? "BOT" : "HUMAN"} ({(s.botScore * 100).toFixed(0)}%)
                      </span>
                      <span className="text-[10px] text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-semibold mt-1">{s.events?.length || 0} events</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Details Panel (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {selectedSession ? (
                <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl p-6 shadow-sm space-y-6">
                  {/* Panel Header */}
                  <div className="flex justify-between items-center pb-4 border-b border-(--color-border) dark:border-(--color-border-dark)">
                    <div>
                      <span className="text-xs font-bold text-(--color-muted-text) dark:text-(--color-muted-text-dark)">Session Identifier</span>
                      <h3 className="font-mono font-bold text-lg text-(--color-text) dark:text-(--color-text-dark)">{selectedSession.id}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-(--color-muted-text) dark:text-(--color-muted-text-dark) block mb-1">Bot Probability</span>
                      <span className={`text-sm font-black px-3 py-1 rounded-lg border ${getBotSeverityColor(selectedSession.botScore)}`}>
                        {(selectedSession.botScore * 100).toFixed(0)}% Bot
                      </span>
                    </div>
                  </div>

                  {/* Environment Fingerprints */}
                  <div>
                    <h4 className="font-bold text-sm text-gray-950 dark:text-white mb-3 flex items-center gap-2">
                      <EmojiIcon name="search" className="w-4 h-4" /> Client Fingerprint Signals
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Navigator Webdriver:</span>
                        <span className={`font-mono font-bold ${selectedSession.botSignals?.webdriver ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {selectedSession.botSignals?.webdriver ? "PRESENT" : "ABSENT"}
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Automation User-Agent:</span>
                        <span className={`font-mono font-bold ${selectedSession.botSignals?.headlessUserAgent ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {selectedSession.botSignals?.headlessUserAgent ? "DETECTED" : "NORMAL"}
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Default Headless Resolution:</span>
                        <span className={`font-mono font-bold ${selectedSession.botSignals?.defaultHeadlessScreen ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {selectedSession.botSignals?.defaultHeadlessScreen ? "SUSPICIOUS" : "NORMAL"}
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Software GL Renderer:</span>
                        <span className={`font-mono font-bold ${selectedSession.botSignals?.softwareRenderer ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {selectedSession.botSignals?.softwareRenderer ? "SwiftShader/Mesa" : "Hardware"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Behavioral Metrics */}
                  <div>
                    <h4 className="font-bold text-sm text-gray-950 dark:text-white mb-3 flex items-center gap-2">
                      <EmojiIcon name="chartUp" className="w-4 h-4" /> Behavioral Cadence & Linearity
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-center">
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-300 font-medium block mb-1">Mouse Path Linearity</span>
                        <span className={`font-bold ${selectedSession.behavior?.mousePaths === "linear" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {selectedSession.behavior?.mousePaths === "linear" ? "Linear (Programmatic)" : "Curved (Human)"}
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-300 font-medium block mb-1">Keystroke Cadence</span>
                        <span className={`font-bold ${selectedSession.behavior?.typingCadence === "robotic" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {selectedSession.behavior?.typingCadence === "robotic" ? "Robotic (Standard Deviation \u2264 5ms)" : "Varied (Human)"}
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-300 font-medium block mb-1">Humanity Index</span>
                        <span className={`font-bold ${selectedSession.behavior?.humanScore <= 0.4 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {((selectedSession.behavior?.humanScore ?? 1.0) * 100).toFixed(0)}% Match
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Session Event Log */}
                  <div>
                    <h4 className="font-bold text-sm text-gray-950 dark:text-white mb-3 flex items-center gap-2">
                      <EmojiIcon name="scroll" className="w-4 h-4" /> Enqueued Events Timeline
                    </h4>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden divide-y divide-gray-200 dark:divide-gray-700 max-h-[220px] overflow-y-auto">
                      {selectedSession.events && selectedSession.events.length > 0 ? (
                        selectedSession.events.map((e, index) => (
                          <div key={index} className="p-3 flex justify-between items-center text-xs font-mono">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              <strong className="text-gray-900 dark:text-gray-100">{e.eventType}</strong>
                              {e.eventData && Object.keys(e.eventData).length > 0 && (
                                <span className="text-gray-600 dark:text-gray-400 font-medium">({JSON.stringify(e.eventData)})</span>
                              )}
                            </div>
                            <span className="text-gray-600 dark:text-gray-300 font-medium">
                              {new Date(e.timestamp).toLocaleTimeString([], { hour12: false })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-600 dark:text-gray-300 text-xs py-4 font-medium">No events registered yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-(--color-muted-text) dark:text-(--color-muted-text-dark) bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl p-6 shadow-sm font-semibold">
                  Select a session to audit.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Charts & Stats */}
        {activeTab === "charts" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-base text-(--color-text) dark:text-(--color-text-dark) mb-4">Traffic Integrity Mix</h3>
              <div className="flex flex-col items-center justify-center py-6">
                {/* SVG Donut Chart */}
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#16A34A" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#DC2626"
                      strokeWidth="3.2"
                      strokeDasharray={`${botRatio} ${100 - botRatio}`}
                      strokeDashoffset="0"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-(--color-text) dark:text-(--color-text-dark)">{botRatio.toFixed(0)}%</span>
                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Suspected Bots</span>
                  </div>
                </div>
                <div className="flex gap-6 mt-6 text-sm font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                    <span className="text-(--color-text) dark:text-(--color-text-dark)">Humans ({humanSessions})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-600"></span>
                    <span className="text-(--color-text) dark:text-(--color-text-dark)">Bots ({botSessions})</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl p-6 shadow-sm flex flex-col">
              <h3 className="font-bold text-base text-(--color-text) dark:text-(--color-text-dark) mb-4">Event Types Distribution</h3>
              <div className="space-y-4 flex-1 overflow-y-auto">
                {Object.entries(eventCounts).length > 0 ? (
                  Object.entries(eventCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => {
                      const maxCount = Math.max(...Object.values(eventCounts));
                      const widthPercent = (count / maxCount) * 100;
                      return (
                        <div key={type} className="text-xs">
                          <div className="flex justify-between font-bold mb-1 text-(--color-text) dark:text-(--color-text-dark)">
                            <span className="font-mono">{type}</span>
                            <span>{count} times</span>
                          </div>
                          <div className="w-full bg-(--color-border) dark:bg-(--color-border-dark) h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${widthPercent}%` }}></div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <p className="text-center text-(--color-muted-text) dark:text-(--color-muted-text-dark) py-10 font-medium">No events found to aggregate.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Slide Heatmap */}
        {activeTab === "heatmaps" && (
          <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-base text-(--color-text) dark:text-(--color-text-dark) mb-2">Slide Navigation Frequency Heatmap</h3>
            <p className="text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-medium mb-6">See which slides audience members spend the most time viewing or navigating back to.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.keys(slideViews).length > 0 ? (
                Object.entries(slideViews).map(([slideId, count]) => {
                  const maxCount = Math.max(...Object.values(slideViews));
                  const intensity = count / maxCount;
                  const bgStyle = {
                    backgroundColor: `rgba(37, 99, 235, ${Math.max(intensity, 0.15)})`,
                    color: intensity > 0.4 ? '#fff' : 'inherit'
                  };
                  return (
                    <div
                      key={slideId}
                      style={bgStyle}
                      className="p-4 rounded-xl border border-(--color-border) dark:border-(--color-border-dark) text-center flex flex-col justify-center items-center gap-1 shadow-sm transition-all hover:scale-105"
                    >
                      <span className="font-mono text-xs uppercase tracking-wider font-bold opacity-90">{slideId}</span>
                      <h4 className="text-xl font-black">{count}</h4>
                      <span className="text-[10px] uppercase font-bold opacity-80">views</span>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center text-(--color-muted-text) dark:text-(--color-muted-text-dark) py-10 font-medium">
                  Navigate some slides to see views registered on the heatmap.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelemetryDashboard;
