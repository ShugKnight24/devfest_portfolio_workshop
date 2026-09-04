import { useEffect, useState } from "react";

export const ScrollProgress = () => {
  const [width, setWidth] = useState(0);

  const scrollHeight = () => {
    const element = document.documentElement;
    const scrollTop = element.scrollTop || document.body.scrollTop;
    const scrollHeight = element.scrollHeight || document.body.scrollHeight;
    const clientHeight = element.clientHeight;

    const windowHeight = scrollHeight - clientHeight;
    const scrolled = (scrollTop / windowHeight) * 100;

    setWidth(scrolled);
  };

  useEffect(() => {
    window.addEventListener("scroll", scrollHeight);
    return () => window.removeEventListener("scroll", scrollHeight);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1.5 z-50 bg-transparent">
      <div
        className="h-full bg-(--color-primary) transition-all duration-150 ease-out"
        style={{ width: `${width}%` }}
      ></div>
    </div>
  );
};
