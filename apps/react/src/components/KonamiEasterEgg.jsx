import { useState, useEffect } from "react";
import { EmojiIcon } from "./Icons/EmojiIcon";
import { useKonamiCode } from "../hooks/useKonamiCode";
import { useTheme } from "../context/ThemeContext";
import { useAchievements } from "./Achievements";

/**
 * Konami Code Easter Egg Component
 *
 * When the user enters the Konami Code (↑↑↓↓←→←→BA),
 * this triggers a fun celebration animation!
 *
 * Features:
 * - Confetti animation
 * - Theme switch to a special "secret" theme
 * - Achievement unlock notification
 */

// Confetti particle component
const Confetti = ({ style }) => (
  <div
    className="absolute w-3 h-3 pointer-events-none"
    style={{
      ...style,
      animation: `confetti-fall ${2 + Math.random() * 2}s linear forwards`,
    }}
  >
    <div
      className="w-full h-full"
      style={{
        backgroundColor: style.color,
        transform: `rotate(${Math.random() * 360}deg)`,
        borderRadius: Math.random() > 0.5 ? "50%" : "0",
      }}
    />
  </div>
);

// Achievement popup
const AchievementPopup = ({ show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-300 animate-bounce-in">
      <div className="bg-linear-to-br from-purple-600 via-pink-500 to-orange-400 p-1 rounded-2xl shadow-2xl">
        <div className="bg-gray-900 rounded-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <EmojiIcon name="gamepad" className="w-14 h-14 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Achievement Unlocked!
          </h2>
          <p className="text-purple-300 text-lg mb-4 font-bold">Secret Gamer</p>
          <p className="text-gray-200 text-sm">
            You found the Konami Code easter egg!
          </p>
          <div className="mt-6 flex justify-center gap-1">
            {["↑", "↑", "↓", "↓", "←", "→", "←", "→", "B", "A"].map(
              (key, i) => (
                <kbd
                  key={i}
                  className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300"
                >
                  {key}
                </kbd>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const KonamiEasterEgg = () => {
  const [activated, setActivated] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [showAchievement, setShowAchievement] = useState(false);
  const { changeTheme, currentTheme } = useTheme();
  const { trackAction } = useAchievements();

  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8B500",
    "#FF69B4",
  ];

  const triggerEasterEgg = () => {
    if (activated) return;

    setActivated(true);
    setShowAchievement(true);

    // Track the Konami code achievement
    trackAction("konami_code");

    // Generate confetti
    const newConfetti = [];
    for (let i = 0; i < 100; i++) {
      newConfetti.push({
        id: i,
        style: {
          left: `${Math.random() * 100}vw`,
          top: `-20px`,
          color: colors[Math.floor(Math.random() * colors.length)],
        },
      });
    }
    setConfetti(newConfetti);

    // Switch to a random fun theme
    const funThemes = [
      "neonNight",
      "sixEyes",
      "divergentFist",
      "gracefulDancer",
    ];
    const randomTheme = funThemes[Math.floor(Math.random() * funThemes.length)];
    if (currentTheme !== randomTheme) {
      changeTheme(randomTheme);
    }

    // Play a sound (if available)
    try {
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Play a little victory jingle
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      let time = audioContext.currentTime;

      notes.forEach((freq, i) => {
        oscillator.frequency.setValueAtTime(freq, time + i * 0.15);
      });

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.8,
      );

      oscillator.start(time);
      oscillator.stop(time + 0.8);
    } catch (e) {
      // Audio not available, that's fine
    }

    // Clear confetti after animation
    setTimeout(() => {
      setConfetti([]);
    }, 4000);

    // Reset activation after some time so it can be triggered again
    setTimeout(() => {
      setActivated(false);
    }, 10000);
  };

  useKonamiCode(triggerEasterEgg);

  return (
    <>
      {/* Confetti container */}
      <div className="fixed inset-0 pointer-events-none z-250 overflow-hidden">
        {confetti.map((particle) => (
          <Confetti key={particle.id} style={particle.style} />
        ))}
      </div>

      {/* Achievement popup */}
      <AchievementPopup
        show={showAchievement}
        onClose={() => setShowAchievement(false)}
      />

      {/* Add confetti animation keyframes */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes bounce-in {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
      `}</style>
    </>
  );
};

export default KonamiEasterEgg;
