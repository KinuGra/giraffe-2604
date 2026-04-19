"use client";

import { useEffect, useState } from "react";

interface ExtinctionOverlayProps {
  functionName: string;
  onDismiss: () => void;
}

const MESSAGES = [
  "この関数は、時代に選ばれなかった。",
  "呼ばれなければ、存在しないのと同じだ。",
  "弱者は淘汰される。それが自然の摂理。",
  "10秒間、誰も必要としなかった。",
  "デジタル進化論——不適者は消える。",
];

export function ExtinctionOverlay({
  functionName,
  onDismiss,
}: ExtinctionOverlayProps) {
  const [phase, setPhase] = useState<"impact" | "message" | "fade">("impact");
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("message"), 800);
    const t2 = setTimeout(() => setMessageIndex(1), 1800);
    const t3 = setTimeout(() => setMessageIndex(2), 2600);
    const t4 = setTimeout(() => setPhase("fade"), 3800);
    const t5 = setTimeout(() => onDismiss(), 4600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onDismiss]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-700 ${
        phase === "fade" ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "radial-gradient(ellipse at center, #1a0000 0%, #000 70%)",
      }}
    >
      {/* Glitch scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.03) 2px, rgba(255,0,0,0.03) 4px)",
        }}
      />

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-6 px-8 text-center">
        {/* Skull */}
        <div
          className={`text-8xl transition-all duration-500 ${
            phase === "impact" ? "scale-150 opacity-0" : "scale-100 opacity-100"
          }`}
          style={{
            filter:
              "drop-shadow(0 0 40px #ff0000) drop-shadow(0 0 80px #ff0000)",
            animation:
              phase === "message" ? "pulse 1s ease-in-out infinite" : undefined,
          }}
        >
          💀
        </div>

        {/* Function name */}
        <div
          className={`font-mono text-2xl font-bold tracking-widest transition-all duration-300 ${
            phase === "impact" ? "opacity-0 scale-75" : "opacity-100 scale-100"
          }`}
          style={{
            color: "#ff3333",
            textShadow: "0 0 20px #ff0000, 0 0 40px #ff0000",
            animation: "glitch 2s infinite",
          }}
        >
          {functionName}
        </div>

        {/* Big text */}
        <div
          className={`text-5xl font-black tracking-tight transition-all duration-500 ${
            phase === "impact"
              ? "opacity-0 translate-y-4"
              : "opacity-100 translate-y-0"
          }`}
          style={{
            color: "#ff0000",
            textShadow: "0 0 30px #ff0000, 0 0 60px #ff0000, 0 0 100px #ff4444",
          }}
        >
          絶　滅
        </div>

        {/* Messages */}
        <div className="space-y-1 min-h-[60px]">
          {MESSAGES.slice(0, messageIndex + 1).map((msg, i) => (
            <p
              key={msg}
              className="text-sm font-mono transition-all duration-500"
              style={{
                color: i === messageIndex ? "#ff6666" : "#551111",
                opacity: i === messageIndex ? 1 : 0.4,
                textShadow: i === messageIndex ? "0 0 10px #ff3333" : "none",
              }}
            >
              {msg}
            </p>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-64 h-0.5 bg-red-950 overflow-hidden rounded-full">
          <div
            className="h-full bg-red-600 transition-all"
            style={{
              width:
                phase === "impact"
                  ? "0%"
                  : phase === "message"
                    ? "60%"
                    : "100%",
              transitionDuration: phase === "message" ? "3000ms" : "500ms",
              boxShadow: "0 0 10px #ff0000",
            }}
          />
        </div>

        <p className="text-xs text-red-900 font-mono">
          この関数は10秒以内に3回以下しか呼ばれなかった
        </p>
      </div>

      <style>{`
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 1px); }
          40% { transform: translate(2px, -1px); }
          60% { transform: translate(-1px, 2px); }
          80% { transform: translate(1px, -2px); }
        }
      `}</style>
    </div>
  );
}
