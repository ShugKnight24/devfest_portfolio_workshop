import { useState, useEffect, useRef } from "react";

export const useTypewriter = ({
  words,
  typingSpeed = 150,
  deletingSpeed = 100,
  loop = false,
}) => {
  const [text, setText] = useState("");
  const wordsRef = useRef(words);
  const typingSpeedRef = useRef(typingSpeed);
  const deletingSpeedRef = useRef(deletingSpeed);
  const loopRef = useRef(loop);

  // Keep refs up-to-date
  useEffect(() => {
    wordsRef.current = words;
    typingSpeedRef.current = typingSpeed;
    deletingSpeedRef.current = deletingSpeed;
    loopRef.current = loop;
  }, [words, typingSpeed, deletingSpeed, loop]);

  useEffect(() => {
    let active = true;
    let timerId = null;
    let currentText = "";
    let isDeleting = false;
    let loopNum = 0;

    const tick = () => {
      if (!active) return;

      const wordsList = wordsRef.current;
      if (!wordsList || wordsList.length === 0) {
        timerId = setTimeout(tick, typingSpeedRef.current);
        return;
      }

      const i = loopNum % wordsList.length;
      const fullText = wordsList[i];

      if (!isDeleting) {
        // Typing
        currentText = fullText.substring(0, currentText.length + 1);
        setText(currentText);

        if (currentText === fullText) {
          // Finished typing word
          if (!loopRef.current && i === wordsList.length - 1) {
            return; // stop typing at last word if no loop
          }
          // Pause before deleting
          timerId = setTimeout(() => {
            isDeleting = true;
            timerId = setTimeout(tick, deletingSpeedRef.current);
          }, 1500);
        } else {
          timerId = setTimeout(tick, typingSpeedRef.current);
        }
      } else {
        // Deleting
        currentText = fullText.substring(0, currentText.length - 1);
        setText(currentText);

        if (currentText === "") {
          isDeleting = false;
          loopNum++;
          // Delay before starting next word
          timerId = setTimeout(tick, typingSpeedRef.current);
        } else {
          timerId = setTimeout(tick, deletingSpeedRef.current);
        }
      }
    };

    // Start the first tick
    timerId = setTimeout(tick, typingSpeedRef.current);

    return () => {
      active = false;
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  return text;
};
