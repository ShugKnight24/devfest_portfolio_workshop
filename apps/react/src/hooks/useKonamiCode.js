import { useEffect, useState } from "react";

export const useKonamiCode = (action) => {
  const [input, setInput] = useState([]);
  const code = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];

  useEffect(() => {
    const onKeyDown = (e) => {
      const newInput = [...input, e.key];

      // Keep only the last N keys where N is code length
      if (newInput.length > code.length) {
        newInput.shift();
      }

      setInput(newInput);

      // Check if it matches
      if (JSON.stringify(newInput) === JSON.stringify(code)) {
        action();
        setInput([]); // Reset
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [input, action]);
};
