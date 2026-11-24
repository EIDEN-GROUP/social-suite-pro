import { cn } from "@/lib/utils";

/**
 * Animated neon-green check mark (the check-mark part of the neon checkbox,
 * without the box). Plays once on mount; use it as a success indicator/icon.
 */
export function NeonCheck({
  size = 18,
  className,
  stroke = "#00ffaa",
}: {
  size?: number;
  className?: string;
  stroke?: string;
}) {
  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className="neon-check-glow" style={{ background: stroke }} />
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke={stroke}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="neon-check-svg relative"
        style={{ filter: `drop-shadow(0 0 5px ${stroke}99)` }}
      >
        <path d="M3,12.5l7,7L21,5" className="neon-check-path" />
      </svg>

      <style>{`
        .neon-check-path {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: neonCheckDraw 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .neon-check-svg {
          animation: neonCheckPop 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .neon-check-glow {
          position: absolute;
          inset: -2px;
          border-radius: 9999px;
          filter: blur(6px);
          opacity: 0;
          animation: neonCheckGlow 0.6s ease forwards;
        }
        @keyframes neonCheckDraw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes neonCheckPop {
          0% { transform: scale(0.7); }
          60% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        @keyframes neonCheckGlow {
          0% { opacity: 0; }
          55% { opacity: 0.4; }
          100% { opacity: 0.18; }
        }
      `}</style>
    </span>
  );
}
