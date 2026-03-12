"use client";

interface ProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
  phase: string;
}

const ADVENTURE_STOPS: { phase: string; emoji: string; label: string }[] = [
  { phase: "intro", emoji: "🏕️", label: "Base Camp" },
  { phase: "exploration", emoji: "🌴", label: "Forest" },
  { phase: "discovery", emoji: "🔍", label: "Cave" },
  { phase: "practice", emoji: "⛰️", label: "Mountain" },
  { phase: "assessment", emoji: "🏰", label: "Castle" },
  { phase: "celebration", emoji: "🏆", label: "Victory!" },
];

export default function ProgressTracker({
  currentStep,
  totalSteps,
  phase,
}: ProgressTrackerProps) {
  const currentIndex = ADVENTURE_STOPS.findIndex((s) => s.phase === phase);
  const activeIdx = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="flex items-center gap-0 px-2 sm:px-4 py-1.5 bg-gradient-to-r from-amber-50 via-yellow-50 to-emerald-50 border-b border-amber-100/60 overflow-x-auto scrollbar-hide">
      {ADVENTURE_STOPS.map((stop, i) => {
        const isPast = i < activeIdx;
        const isActive = i === activeIdx;
        const isFuture = i > activeIdx;

        return (
          <div key={stop.phase} className="flex items-center">
            {/* Stop marker */}
            <div className="flex flex-col items-center min-w-[36px] sm:min-w-[48px]">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base transition-all ${
                  isActive
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-300/50 scale-110 ring-2 ring-amber-300/50 ring-offset-1"
                    : isPast
                    ? "bg-emerald-400 shadow-sm"
                    : "bg-gray-200"
                }`}
              >
                {isPast ? "✓" : stop.emoji}
              </div>
              <span
                className={`text-[8px] sm:text-[9px] font-bold mt-0.5 ${
                  isActive
                    ? "text-amber-600"
                    : isPast
                    ? "text-emerald-500"
                    : "text-gray-300"
                }`}
              >
                {stop.label}
              </span>
            </div>

            {/* Trail between stops */}
            {i < ADVENTURE_STOPS.length - 1 && (
              <div className="flex-1 min-w-[12px] sm:min-w-[20px] h-1 mx-0.5 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gray-200 rounded-full" />
                {isPast && (
                  <div className="absolute inset-0 bg-emerald-400 rounded-full" />
                )}
                {isActive && (
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-amber-300 rounded-full"
                    style={{ width: `${((currentStep % 1) || 0.5) * 100}%` }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
