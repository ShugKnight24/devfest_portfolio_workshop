import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const telemetryPlugin = () => {
  const sessions = {};

  return {
    name: "vite-plugin-telemetry",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        if (parsedUrl.pathname === "/api/telemetry") {
          if (req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => {
              body += chunk;
            });
            req.on("end", () => {
              try {
                const data = JSON.parse(body);
                const { sessionId, botScore, botSignals, behavior, events, framework } = data;
                
                if (sessionId) {
                  if (!sessions[sessionId]) {
                    sessions[sessionId] = {
                      id: sessionId,
                      botScore: botScore ?? 0.0,
                      botSignals: botSignals ?? {},
                      behavior: behavior ?? { humanScore: 1.0 },
                      events: [],
                      created_at: new Date().toISOString(),
                      last_active: new Date().toISOString(),
                      framework: framework ?? "react"
                    };
                  }
                  if (events && Array.isArray(events)) {
                    sessions[sessionId].events.push(...events);
                    const uniqueEventsMap = new Map();
                    sessions[sessionId].events.forEach(e => {
                      uniqueEventsMap.set(e.timestamp + e.eventType, e);
                    });
                    sessions[sessionId].events = Array.from(uniqueEventsMap.values());
                  }
                  if (behavior) {
                    sessions[sessionId].behavior = behavior;
                  }
                  if (botScore !== undefined) {
                    sessions[sessionId].botScore = botScore;
                  }
                  if (botSignals) {
                    sessions[sessionId].botSignals = botSignals;
                  }
                  sessions[sessionId].last_active = new Date().toISOString();
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true }));
              } catch (err) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Invalid JSON" }));
              }
            });
            return;
          } else if (req.method === "GET") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(Object.values(sessions)));
            return;
          }
        }
        next();
      });
    },
  };
};

export default defineConfig({
  plugins: [react(), tailwindcss(), telemetryPlugin()],
  server: {
    port: 3000,
    open: true,
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: "./src/test/setup.js",
    css: true,
    include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/test/"],
    },
  },
});
