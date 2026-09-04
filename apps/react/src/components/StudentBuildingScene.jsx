/**
 * Animated SVG Scene: Student Building Their Website
 *
 * A charming, hand-drawn style illustration of a student at a desk
 * with a laptop, surrounded by floating code symbols, with smooth
 * CSS animations bringing the scene to life.
 */
const StudentBuildingScene = ({ className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes typing {
          0% { width: 0; }
          50% { width: 100%; }
          51% { width: 100%; }
          100% { width: 0; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes steam {
          0% { transform: translateY(0) scale(1); opacity: 0.6; }
          100% { transform: translateY(-12px) scale(1.5); opacity: 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes wave-hand {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(15deg); }
          75% { transform: rotate(-10deg); }
        }
        .scene-float { animation: float 3s ease-in-out infinite; }
        .scene-float-delay { animation: float 3.5s ease-in-out infinite 0.5s; }
        .scene-float-slow { animation: floatSlow 4s ease-in-out infinite 1s; }
        .scene-steam1 { animation: steam 2s ease-out infinite; }
        .scene-steam2 { animation: steam 2s ease-out infinite 0.6s; }
        .scene-steam3 { animation: steam 2s ease-out infinite 1.2s; }
        .scene-blink { animation: blink 1s step-end infinite; }
        .scene-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .scene-spin { animation: spin-slow 8s linear infinite; transform-origin: center; }
        .scene-wave { animation: wave-hand 2s ease-in-out infinite; transform-origin: 75% 75%; }
      `}</style>

      <svg
        viewBox="0 0 800 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        role="img"
        aria-label="Illustration of a student building a website on their laptop"
      >
        {/* Background gradient */}
        <defs>
          <linearGradient
            id="bgGrad"
            x1="0"
            y1="0"
            x2="800"
            y2="500"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              offset="0%"
              stopColor="var(--color-primary, #6366f1)"
              stopOpacity="0.05"
            />
            <stop
              offset="100%"
              stopColor="var(--color-secondary, #8b5cf6)"
              stopOpacity="0.1"
            />
          </linearGradient>
          <linearGradient
            id="deskGrad"
            x1="200"
            y1="350"
            x2="600"
            y2="420"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#92400e" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          <linearGradient
            id="screenGrad"
            x1="310"
            y1="175"
            x2="530"
            y2="320"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>
          <linearGradient
            id="codeGlow"
            x1="320"
            y1="200"
            x2="520"
            y2="310"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient
            id="chairGrad"
            x1="340"
            y1="360"
            x2="340"
            y2="460"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient
            id="shirtGrad"
            x1="380"
            y1="280"
            x2="420"
            y2="370"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="var(--color-primary, #6366f1)" />
            <stop offset="100%" stopColor="var(--color-secondary, #8b5cf6)" />
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* Background fill */}
        <rect width="800" height="500" fill="url(#bgGrad)" rx="16" />

        {/* ========== DESK ========== */}
        <rect
          x="180"
          y="355"
          width="440"
          height="18"
          rx="4"
          fill="url(#deskGrad)"
          filter="url(#shadow)"
        />
        {/* Desk legs */}
        <rect x="200" y="373" width="12" height="80" rx="3" fill="#78350f" />
        <rect x="588" y="373" width="12" height="80" rx="3" fill="#78350f" />
        {/* Desk edge highlight */}
        <rect
          x="180"
          y="355"
          width="440"
          height="3"
          rx="1"
          fill="#a16207"
          opacity="0.4"
        />

        {/* ========== CHAIR ========== */}
        <rect
          x="310"
          y="380"
          width="80"
          height="14"
          rx="7"
          fill="url(#chairGrad)"
        />
        {/* Chair back */}
        <rect x="320" y="330" width="60" height="55" rx="8" fill="#475569" />
        <rect
          x="328"
          y="338"
          width="44"
          height="39"
          rx="5"
          fill="#64748b"
          opacity="0.3"
        />
        {/* Chair legs */}
        <rect x="330" y="394" width="6" height="60" rx="2" fill="#64748b" />
        <rect x="366" y="394" width="6" height="60" rx="2" fill="#64748b" />
        {/* Chair base */}
        <ellipse cx="350" cy="455" rx="30" ry="4" fill="#334155" />

        {/* ========== LAPTOP ========== */}
        {/* Laptop base / keyboard */}
        <g filter="url(#shadow)">
          <rect x="300" y="338" width="220" height="18" rx="3" fill="#374151" />
          <rect x="300" y="338" width="220" height="2" rx="1" fill="#4b5563" />
          {/* Keyboard keys (tiny rectangles) */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <rect
              key={`key-${i}`}
              x={318 + i * 20}
              y={344}
              width={14}
              height={4}
              rx={1}
              fill="#4b5563"
            />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <rect
              key={`key2-${i}`}
              x={328 + i * 20}
              y={350}
              width={14}
              height={4}
              rx={1}
              fill="#4b5563"
            />
          ))}
          {/* Trackpad */}
          <rect x={385} y={349} width={50} height={5} rx={2} fill="#4b5563" />
        </g>

        {/* Laptop screen */}
        <g filter="url(#shadow)">
          {/* Screen bezel */}
          <rect
            x="305"
            y="170"
            width="210"
            height="170"
            rx="8"
            fill="#1f2937"
          />
          {/* Screen */}
          <rect
            x="312"
            y="177"
            width="196"
            height="153"
            rx="4"
            fill="url(#screenGrad)"
          />
          {/* Screen glow overlay */}
          <rect
            x="312"
            y="177"
            width="196"
            height="153"
            rx="4"
            fill="url(#codeGlow)"
          />

          {/* === CODE ON SCREEN === */}
          {/* Title bar dots */}
          <circle cx="325" cy="188" r="3" fill="#ef4444" opacity="0.8" />
          <circle cx="335" cy="188" r="3" fill="#eab308" opacity="0.8" />
          <circle cx="345" cy="188" r="3" fill="#22c55e" opacity="0.8" />

          {/* Code lines with syntax coloring */}
          {/* import line */}
          <rect
            x="322"
            y="200"
            width="24"
            height="3"
            rx="1"
            fill="#c084fc"
            opacity="0.9"
          />
          <rect
            x="350"
            y="200"
            width="40"
            height="3"
            rx="1"
            fill="#67e8f9"
            opacity="0.8"
          />
          <rect
            x="394"
            y="200"
            width="16"
            height="3"
            rx="1"
            fill="#c084fc"
            opacity="0.9"
          />
          <rect
            x="414"
            y="200"
            width="50"
            height="3"
            rx="1"
            fill="#86efac"
            opacity="0.8"
          />

          {/* function component line */}
          <rect
            x="322"
            y="210"
            width="20"
            height="3"
            rx="1"
            fill="#c084fc"
            opacity="0.9"
          />
          <rect
            x="346"
            y="210"
            width="36"
            height="3"
            rx="1"
            fill="#fcd34d"
            opacity="0.9"
          />
          <rect
            x="386"
            y="210"
            width="8"
            height="3"
            rx="1"
            fill="#94a3b8"
            opacity="0.7"
          />
          <rect
            x="398"
            y="210"
            width="12"
            height="3"
            rx="1"
            fill="#fcd34d"
            opacity="0.9"
          />
          <rect
            x="414"
            y="210"
            width="14"
            height="3"
            rx="1"
            fill="#94a3b8"
            opacity="0.7"
          />

          {/* return ( */}
          <rect
            x="332"
            y="220"
            width="24"
            height="3"
            rx="1"
            fill="#c084fc"
            opacity="0.9"
          />
          <rect
            x="360"
            y="220"
            width="8"
            height="3"
            rx="1"
            fill="#94a3b8"
            opacity="0.7"
          />

          {/* JSX div */}
          <rect
            x="342"
            y="230"
            width="8"
            height="3"
            rx="1"
            fill="#94a3b8"
            opacity="0.6"
          />
          <rect
            x="354"
            y="230"
            width="14"
            height="3"
            rx="1"
            fill="#f472b6"
            opacity="0.9"
          />
          <rect
            x="372"
            y="230"
            width="30"
            height="3"
            rx="1"
            fill="#67e8f9"
            opacity="0.7"
          />
          <rect
            x="406"
            y="230"
            width="8"
            height="3"
            rx="1"
            fill="#94a3b8"
            opacity="0.6"
          />

          {/* h1 */}
          <rect
            x="352"
            y="240"
            width="8"
            height="3"
            rx="1"
            fill="#94a3b8"
            opacity="0.6"
          />
          <rect
            x="364"
            y="240"
            width="8"
            height="3"
            rx="1"
            fill="#f472b6"
            opacity="0.9"
          />
          <rect
            x="376"
            y="240"
            width="50"
            height="3"
            rx="1"
            fill="#e2e8f0"
            opacity="0.8"
          />
          <rect
            x="430"
            y="240"
            width="12"
            height="3"
            rx="1"
            fill="#94a3b8"
            opacity="0.6"
          />

          {/* More code lines */}
          <rect
            x="352"
            y="250"
            width="8"
            height="3"
            rx="1"
            fill="#94a3b8"
            opacity="0.6"
          />
          <rect
            x="364"
            y="250"
            width="8"
            height="3"
            rx="1"
            fill="#f472b6"
            opacity="0.9"
          />
          <rect
            x="376"
            y="250"
            width="34"
            height="3"
            rx="1"
            fill="#86efac"
            opacity="0.8"
          />
          <rect
            x="414"
            y="250"
            width="8"
            height="3"
            rx="1"
            fill="#94a3b8"
            opacity="0.6"
          />

          {/* skills.map line */}
          <rect
            x="352"
            y="260"
            width="8"
            height="3"
            rx="1"
            fill="#94a3b8"
            opacity="0.6"
          />
          <rect
            x="364"
            y="260"
            width="26"
            height="3"
            rx="1"
            fill="#67e8f9"
            opacity="0.8"
          />
          <rect
            x="394"
            y="260"
            width="8"
            height="3"
            rx="1"
            fill="#fcd34d"
            opacity="0.9"
          />
          <rect
            x="406"
            y="260"
            width="36"
            height="3"
            rx="1"
            fill="#e2e8f0"
            opacity="0.7"
          />
          <rect
            x="446"
            y="260"
            width="8"
            height="3"
            rx="1"
            fill="#94a3b8"
            opacity="0.6"
          />

          {/* Closing tags */}
          <rect
            x="342"
            y="270"
            width="8"
            height="3"
            rx="1"
            fill="#94a3b8"
            opacity="0.6"
          />
          <rect
            x="354"
            y="270"
            width="14"
            height="3"
            rx="1"
            fill="#f472b6"
            opacity="0.9"
          />
          <rect
            x="372"
            y="270"
            width="8"
            height="3"
            rx="1"
            fill="#94a3b8"
            opacity="0.6"
          />

          <rect
            x="332"
            y="280"
            width="8"
            height="3"
            rx="1"
            fill="#94a3b8"
            opacity="0.7"
          />
          <rect
            x="322"
            y="290"
            width="8"
            height="3"
            rx="1"
            fill="#94a3b8"
            opacity="0.7"
          />

          {/* Animated typing cursor */}
          <rect
            x="334"
            y="290"
            width="2"
            height="8"
            rx="1"
            fill="#818cf8"
            className="scene-blink"
          />

          {/* Line numbers */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <text
              key={`ln-${i}`}
              x="316"
              y={203 + i * 10}
              fontSize="4"
              fill="#6366f1"
              opacity="0.4"
              textAnchor="end"
            >
              {i + 1}
            </text>
          ))}

          {/* Camera notch on laptop */}
          <circle cx="410" cy="174" r="2" fill="#374151" />
          <circle cx="410" cy="174" r="1" fill="#4b5563" />
        </g>

        {/* ========== STUDENT CHARACTER ========== */}
        {/* Body / Torso */}
        <ellipse cx="400" cy="345" rx="40" ry="20" fill="url(#shirtGrad)" />

        {/* Neck */}
        <rect x="392" y="295" width="16" height="15" rx="4" fill="#d4a574" />

        {/* Head */}
        <ellipse cx="400" cy="278" rx="28" ry="30" fill="#d4a574" />

        {/* Hair */}
        <path
          d="M372 270 C372 248 385 238 400 238 C415 238 428 248 428 270 C428 262 420 252 400 252 C380 252 372 262 372 270Z"
          fill="#1c1917"
        />
        {/* Hair bangs */}
        <path
          d="M376 268 C378 258 388 252 400 250 C395 258 380 260 376 268Z"
          fill="#292524"
        />

        {/* Eyes */}
        <ellipse cx="390" cy="280" rx="4" ry="4.5" fill="white" />
        <ellipse cx="410" cy="280" rx="4" ry="4.5" fill="white" />
        <ellipse cx="391" cy="281" rx="2.5" ry="2.5" fill="#1e293b" />
        <ellipse cx="411" cy="281" rx="2.5" ry="2.5" fill="#1e293b" />
        {/* Eye highlights */}
        <circle cx="392" cy="279.5" r="1" fill="white" />
        <circle cx="412" cy="279.5" r="1" fill="white" />

        {/* Eyebrows - focused expression */}
        <path
          d="M384 274 Q390 272 396 274"
          stroke="#292524"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M404 274 Q410 272 416 274"
          stroke="#292524"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Nose */}
        <path
          d="M398 286 Q400 289 402 286"
          stroke="#b8916c"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />

        {/* Smile */}
        <path
          d="M392 293 Q400 298 408 293"
          stroke="#9a7b5b"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Ears */}
        <ellipse cx="372" cy="280" rx="5" ry="7" fill="#d4a574" />
        <ellipse cx="428" cy="280" rx="5" ry="7" fill="#d4a574" />

        {/* Arms reaching to keyboard */}
        {/* Left arm */}
        <path
          d="M370 335 Q350 340 330 350 Q320 354 315 350"
          stroke="url(#shirtGrad)"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
        />
        {/* Left hand */}
        <circle cx="315" cy="348" r="7" fill="#d4a574" />

        {/* Right arm */}
        <path
          d="M430 335 Q450 340 470 350 Q480 354 490 350"
          stroke="url(#shirtGrad)"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
        />
        {/* Right hand */}
        <circle cx="490" cy="348" r="7" fill="#d4a574" />

        {/* ========== COFFEE MUG ========== */}
        <g>
          {/* Mug body */}
          <rect x="570" y="328" width="28" height="26" rx="3" fill="#7c3aed" />
          <rect x="570" y="328" width="28" height="4" rx="2" fill="#8b5cf6" />
          {/* Handle */}
          <path
            d="M598 334 Q608 334 608 341 Q608 348 598 348"
            stroke="#7c3aed"
            strokeWidth="4"
            fill="none"
          />
          {/* Heart on mug */}
          <path
            d="M582 340 Q580 337 583 336 Q586 337 584 340 Q586 337 588 336 Q591 337 589 340 L585.5 344Z"
            fill="#fbbf24"
          />

          {/* Animated steam */}
          <path
            d="M576 325 Q578 320 576 315"
            stroke="#94a3b8"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            className="scene-steam1"
            opacity="0.4"
          />
          <path
            d="M584 324 Q582 318 584 312"
            stroke="#94a3b8"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            className="scene-steam2"
            opacity="0.4"
          />
          <path
            d="M591 325 Q593 319 591 313"
            stroke="#94a3b8"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            className="scene-steam3"
            opacity="0.4"
          />
        </g>

        {/* ========== PLANT ========== */}
        <g>
          {/* Pot */}
          <rect x="632" y="335" width="30" height="20" rx="3" fill="#ea580c" />
          <rect x="629" y="332" width="36" height="6" rx="3" fill="#f97316" />
          {/* Stems & leaves */}
          <path
            d="M647 332 Q647 315 640 305"
            stroke="#16a34a"
            strokeWidth="2"
            fill="none"
          />
          <path d="M640 305 Q634 300 630 305 Q634 302 640 305" fill="#22c55e" />
          <path
            d="M647 332 Q650 318 655 310"
            stroke="#16a34a"
            strokeWidth="2"
            fill="none"
          />
          <path d="M655 310 Q660 305 663 310 Q659 307 655 310" fill="#22c55e" />
          <path
            d="M647 332 Q647 320 647 312"
            stroke="#16a34a"
            strokeWidth="2"
            fill="none"
          />
          <path d="M647 312 Q644 306 648 304 Q650 306 647 312" fill="#4ade80" />
        </g>

        {/* ========== FLOATING CODE SYMBOLS ========== */}

        {/* React atom logo - floating */}
        <g className="scene-float" style={{ transformOrigin: "160px 120px" }}>
          <g className="scene-spin" style={{ transformOrigin: "160px 120px" }}>
            <ellipse
              cx="160"
              cy="120"
              rx="22"
              ry="8"
              fill="none"
              stroke="#61dafb"
              strokeWidth="1.5"
              opacity="0.6"
            />
            <ellipse
              cx="160"
              cy="120"
              rx="22"
              ry="8"
              fill="none"
              stroke="#61dafb"
              strokeWidth="1.5"
              opacity="0.6"
              transform="rotate(60 160 120)"
            />
            <ellipse
              cx="160"
              cy="120"
              rx="22"
              ry="8"
              fill="none"
              stroke="#61dafb"
              strokeWidth="1.5"
              opacity="0.6"
              transform="rotate(120 160 120)"
            />
          </g>
          <circle cx="160" cy="120" r="3" fill="#61dafb" />
        </g>

        {/* Curly braces { } */}
        <g className="scene-float-delay">
          <text
            x="650"
            y="180"
            fontSize="28"
            fill="var(--color-primary, #6366f1)"
            opacity="0.5"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {"{"}
          </text>
          <text
            x="670"
            y="180"
            fontSize="28"
            fill="var(--color-secondary, #8b5cf6)"
            opacity="0.5"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {"}"}
          </text>
        </g>

        {/* Angle brackets < /> */}
        <g className="scene-float-slow">
          <text
            x="120"
            y="280"
            fontSize="22"
            fill="var(--color-primary, #6366f1)"
            opacity="0.4"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {"</>"}
          </text>
        </g>

        {/* CSS # symbol */}
        <g className="scene-float">
          <text
            x="680"
            y="280"
            fontSize="24"
            fill="#38bdf8"
            opacity="0.4"
            fontFamily="monospace"
            fontWeight="bold"
          >
            #
          </text>
        </g>

        {/* Stars / sparkles */}
        <g className="scene-float-delay">
          <path
            d="M200 200 l3 8 8 3 -8 3 -3 8 -3-8 -8-3 8-3z"
            fill="#fbbf24"
            opacity="0.6"
          />
        </g>
        <g className="scene-float-slow">
          <path
            d="M640 130 l2 6 6 2 -6 2 -2 6 -2-6 -6-2 6-2z"
            fill="#818cf8"
            opacity="0.5"
          />
        </g>
        <g className="scene-float">
          <path
            d="M250 150 l2 5 5 2 -5 2 -2 5 -2-5 -5-2 5-2z"
            fill="#f472b6"
            opacity="0.4"
          />
        </g>

        {/* Lightbulb - idea floating */}
        <g
          className="scene-float-slow"
          style={{ transformOrigin: "700px 100px" }}
        >
          <circle
            cx="700"
            cy="100"
            r="12"
            fill="#fbbf24"
            opacity="0.2"
            className="scene-glow"
          />
          <path
            d="M695 96 Q695 88 700 86 Q705 88 705 96 Q705 99 703 100 L697 100 Q695 99 695 96Z"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1.5"
            opacity="0.7"
          />
          <rect
            x="697"
            y="100"
            width="6"
            height="3"
            rx="1"
            fill="#fbbf24"
            opacity="0.7"
          />
          {/* Light rays */}
          <line
            x1="700"
            y1="78"
            x2="700"
            y2="75"
            stroke="#fbbf24"
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1="712"
            y1="86"
            x2="714"
            y2="84"
            stroke="#fbbf24"
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1="688"
            y1="86"
            x2="686"
            y2="84"
            stroke="#fbbf24"
            strokeWidth="1"
            opacity="0.4"
          />
        </g>

        {/* Rocket - small */}
        <g
          className="scene-float-delay"
          style={{ transformOrigin: "130px 180px" }}
        >
          <path
            d="M130 188 L130 174 Q130 168 134 168 Q138 168 138 174 L138 188Z"
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth="0.5"
          />
          <path d="M127 186 L130 188 L130 182Z" fill="#ef4444" opacity="0.8" />
          <path d="M138 182 L138 188 L141 186Z" fill="#ef4444" opacity="0.8" />
          <circle cx="134" cy="175" r="2" fill="#38bdf8" opacity="0.8" />
          {/* Flame */}
          <path d="M131 188 Q134 195 137 188" fill="#f97316" opacity="0.7" />
          <path d="M132 188 Q134 193 136 188" fill="#fbbf24" opacity="0.8" />
        </g>

        {/* Terminal prompt */}
        <g className="scene-float-slow">
          <rect
            x="670"
            y="230"
            width="70"
            height="30"
            rx="4"
            fill="#1e293b"
            opacity="0.7"
          />
          <text
            x="678"
            y="248"
            fontSize="8"
            fill="#22c55e"
            fontFamily="monospace"
            opacity="0.8"
          >
            $ npm run
          </text>
          <rect
            x="728"
            y="243"
            width="1.5"
            height="8"
            rx="0.5"
            fill="#22c55e"
            opacity="0.8"
            className="scene-blink"
          />
        </g>

        {/* Small dots pattern */}
        {[
          [100, 350],
          [115, 360],
          [108, 380],
          [700, 350],
          [715, 365],
          [690, 375],
        ].map(([x, y], i) => (
          <circle
            key={`dot-${i}`}
            cx={x}
            cy={y}
            r="2"
            fill="var(--color-primary, #6366f1)"
            opacity="0.15"
          />
        ))}

        {/* Thought bubble with component tree hint */}
        <g className="scene-float-slow">
          <ellipse
            cx="470"
            cy="220"
            rx="35"
            ry="20"
            fill="white"
            opacity="0.9"
            stroke="#e2e8f0"
            strokeWidth="1"
          />
          <circle cx="445" cy="242" r="5" fill="white" opacity="0.8" />
          <circle cx="438" cy="252" r="3" fill="white" opacity="0.7" />
          {/* Mini component tree inside bubble */}
          <rect
            x="455"
            y="213"
            width="30"
            height="5"
            rx="1.5"
            fill="#818cf8"
            opacity="0.5"
          />
          <rect
            x="460"
            y="221"
            width="22"
            height="4"
            rx="1"
            fill="#a78bfa"
            opacity="0.4"
          />
          <rect
            x="465"
            y="228"
            width="16"
            height="3"
            rx="1"
            fill="#c4b5fd"
            opacity="0.3"
          />
        </g>
      </svg>
    </div>
  );
};

export default StudentBuildingScene;
