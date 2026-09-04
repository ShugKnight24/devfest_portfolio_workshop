/**
 * Shared Telemetry & Bot Detection System
 */

let eventQueue = [];
let sessionId = "";
let botSignals = {};
let botScore = 0.0;
let mouseMovements = [];
let keystrokeIntervals = [];
let lastKeyTime = 0;
let collectorEndpoint = "/api/telemetry";

// Heuristic client-side bot detection
export function analyzeEnvironment() {
  const signals = {};
  let score = 0.0;

  // 1. Webdriver detection
  if (navigator.webdriver) {
    signals.webdriver = true;
    score += 0.8;
  }

  // 2. Headless user agent check
  const ua = navigator.userAgent;
  if (/HeadlessChrome|Lighthouse|PhantomJS|Selenium|Puppeteer|Playwright/i.test(ua)) {
    signals.headlessUserAgent = true;
    score += 0.9;
  }

  // 3. Automation library global indicators
  const botGlobals = [
    '__webdriver_evaluate',
    '__selenium_evaluate',
    '__webdriver_unwrapped',
    '__driver_evaluate',
    '__selenium_unwrapped',
    '__fxdriver_evaluate',
    '__driver_unwrapped',
    '_Phantom_importJS',
    'callPhantom',
    '_phantom',
    'Phantom'
  ];
  const foundGlobals = botGlobals.filter(g => typeof window[g] !== 'undefined');
  if (foundGlobals.length > 0) {
    signals.automationGlobals = foundGlobals;
    score += 0.95;
  }

  // 4. Unusual screen resolution ratio (Headless default: 800x600)
  if (window.screen.width === 800 && window.screen.height === 600) {
    signals.defaultHeadlessScreen = true;
    score += 0.4;
  }

  // 5. Canvas check
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("DevFest2026", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("DevFest2026", 4, 17);
    const canvasText = canvas.toDataURL();
    signals.canvasHash = canvasText.substring(20, 40); // snippet of hash
  } catch (e) {
    signals.canvasBlocked = true;
  }

  // 6. WebGL swiftshader/mesa rendering check
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        signals.webglVendor = vendor;
        signals.webglRenderer = renderer;
        if (/SwiftShader|Mesa|Software|VirtualBox/i.test(renderer)) {
          signals.softwareRenderer = true;
          score += 0.6;
        }
      }
    }
  } catch (e) {
    signals.webglBlocked = true;
  }

  botSignals = signals;
  botScore = Math.min(score, 1.0);
  return { botScore, botSignals };
}

// Track actions to detect programmatic interactions
export function initBehaviorTracking() {
  // Track mouse curves
  window.addEventListener("mousemove", (e) => {
    if (mouseMovements.length < 50) {
      mouseMovements.push({ x: e.clientX, y: e.clientY, t: Date.now() });
    }
  });

  // Track keyboard cadence
  window.addEventListener("keydown", (e) => {
    const now = Date.now();
    if (lastKeyTime > 0) {
      keystrokeIntervals.push(now - lastKeyTime);
    }
    lastKeyTime = now;
  });
}

// Analyze behavioral scores (human vs bot behavior)
export function analyzeBehavior() {
  const analysis = {
    mousePaths: "curved",
    typingCadence: "varied",
    humanScore: 1.0
  };

  // 1. Analyze mouse straight lines (bot movements are often perfectly linear)
  if (mouseMovements.length > 5) {
    let linearMovements = 0;
    for (let i = 2; i < mouseMovements.length; i++) {
      const p1 = mouseMovements[i - 2];
      const p2 = mouseMovements[i - 1];
      const p3 = mouseMovements[i];
      // calculate cross product of vectors (p2-p1) and (p3-p1) to find linearity
      const crossProduct = Math.abs((p2.y - p1.y) * (p3.x - p1.x) - (p2.x - p1.x) * (p3.y - p1.y));
      if (crossProduct < 0.1) {
        linearMovements++;
      }
    }
    const ratio = linearMovements / mouseMovements.length;
    if (ratio > 0.8) {
      analysis.mousePaths = "linear";
      analysis.humanScore -= 0.4;
    }
  }

  // 2. Analyze typing cadence (perfect intervals indicate bot typing)
  if (keystrokeIntervals.length > 3) {
    const sum = keystrokeIntervals.reduce((a, b) => a + b, 0);
    const mean = sum / keystrokeIntervals.length;
    const variance = keystrokeIntervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / keystrokeIntervals.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 5.0) { // standard deviation less than 5ms is highly programmatic
      analysis.typingCadence = "robotic";
      analysis.humanScore -= 0.5;
    }
  }

  analysis.humanScore = Math.max(analysis.humanScore, 0.0);
  return analysis;
}

function saveLocalSession() {
  try {
    const raw = localStorage.getItem("telemetry_local_sessions");
    const localSessions = (raw && raw.trim().startsWith("{")) ? JSON.parse(raw) : {};
    localSessions[sessionId] = {
      id: sessionId,
      botScore,
      botSignals,
      behavior: analyzeBehavior(),
      events: (localSessions[sessionId]?.events || []).concat(eventQueue),
      created_at: localSessions[sessionId]?.created_at || new Date().toISOString(),
      last_active: new Date().toISOString(),
      framework: "react"
    };
    // Keep only unique events
    const uniqueEventsMap = new Map();
    localSessions[sessionId].events.forEach(e => {
      uniqueEventsMap.set(e.timestamp + e.eventType, e);
    });
    localSessions[sessionId].events = Array.from(uniqueEventsMap.values());
    
    localStorage.setItem("telemetry_local_sessions", JSON.stringify(localSessions));
  } catch (e) {
    // Silently swallow storage errors to avoid console pollution
  }
}

// Telemetry state management
export function initTelemetry(session, endpoint = "/api/telemetry") {
  sessionId = session || Math.random().toString(36).substring(2, 15);
  collectorEndpoint = endpoint;
  analyzeEnvironment();
  initBehaviorTracking();

  // Batch flush every 30s
  setInterval(flushQueue, 30000);

  // Flush on unload
  window.addEventListener("beforeunload", flushQueue);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushQueue();
    }
  });

  saveLocalSession();

  trackEvent("session_start", {
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    botScore,
    botSignals
  });
}

export function trackEvent(eventType, eventData = {}) {
  const event = {
    sessionId,
    eventType,
    eventData,
    timestamp: new Date().toISOString()
  };

  eventQueue.push(event);
  saveLocalSession();

  // If too many events, flush immediately
  if (eventQueue.length >= 10) {
    flushQueue();
  }
}

export function flushQueue() {
  if (eventQueue.length === 0) return;

  const payload = {
    sessionId,
    botScore,
    botSignals,
    behavior: analyzeBehavior(),
    events: [...eventQueue]
  };

  eventQueue = [];

  // Use sendBeacon if available for reliable unload deliveries
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon(collectorEndpoint, blob);
  } else if (typeof fetch === "function") {
    try {
      fetch(collectorEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch {
      // Silently swallow in offline / testing environments
    }
  }
}
