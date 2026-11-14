import { X } from "lucide-react";
import { useEffect, useState } from "react";

// Authentic 5x5 Animated Pixel Matrix from novopix.uk (#mk) cycling N - O - V - O - P - I - X
const NOVOPIX_LETTERS: string[][] = [
  ["A...X", "XX..X", "X.X.X", "X..XX", "X...X"], // N
  [".XXX.", "X...X", "X...X", "X...X", ".XXA."], // O
  ["X...X", "X...X", ".X.X.", ".X.X.", "..A.."], // V
  [".XXX.", "X...X", "X...X", "X...X", ".XXA."], // O
  ["XXXX.", "X...X", "XXXA.", "X....", "X...."], // P
  ["..A..", ".....", "..X..", "..X..", "..X.."], // I
  ["X...X", ".X.X.", "..A..", ".X.X.", "X...X"], // X
];

export function NovoPixAnimatedMark({ sizeClass = "w-6 h-6" }: { sizeClass?: string }) {
  const [letterIdx, setLetterIdx] = useState<number>(0);
  const [lastManualMs, setLastManualMs] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden && Date.now() - lastManualMs > 1800) {
        setLetterIdx((prev) => (prev + 1) % NOVOPIX_LETTERS.length);
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [lastManualMs]);

  const handleAdvance = () => {
    setLastManualMs(Date.now());
    setLetterIdx((prev) => (prev + 1) % NOVOPIX_LETTERS.length);
  };

  const matrix = NOVOPIX_LETTERS[letterIdx];

  return (
    <svg
      viewBox="0 0 60 60"
      className={`${sizeClass} cursor-pointer select-none`}
      onMouseEnter={handleAdvance}
      onClick={handleAdvance}
      aria-label="NovoPix animated pixel mark"
    >
      {Array.from({ length: 25 }).map((_, k) => {
        const x = k % 5;
        const y = Math.floor(k / 5);
        const cell = matrix[y][x];
        const isVisible = cell !== ".";
        const isAccent = cell === "A";
        return (
          <rect
            key={k}
            className="np-cell"
            x={x * 12 + 1}
            y={y * 12 + 1}
            width={10}
            height={10}
            rx={2.4}
            fill={isAccent ? "#ffc233" : "#ffffff"}
            style={{
              transform: isVisible ? "scale(1)" : "scale(0)",
              transitionDelay: `${(x + y) * 0.03}s`,
            }}
          />
        );
      })}
    </svg>
  );
}
