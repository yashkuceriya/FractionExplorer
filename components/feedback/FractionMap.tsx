"use client";

import { motion, AnimatePresence } from "framer-motion";
import TutorAvatar from "@/components/chat/TutorAvatar";

// ── Location data ────────────────────────────────────────────────────

interface MapLocation {
  id: string;
  phase: string;
  name: string;
  description: string;
  skill: string;
  x: number; // percentage
  y: number; // percentage
  fractions: string[];
}

const MAP_LOCATIONS: MapLocation[] = [
  {
    id: "base",
    phase: "intro",
    name: "Flower Garden",
    description: "Where every explorer begins!",
    skill: "Learn what fractions are",
    x: 14,
    y: 80,
    fractions: ["½", "¼"],
  },
  {
    id: "forest",
    phase: "exploration",
    name: "Fraction Forest",
    description: "Explore the fraction blocks!",
    skill: "Drag, tap, and discover",
    x: 32,
    y: 62,
    fractions: ["⅓", "⅔", "¾"],
  },
  {
    id: "cave",
    phase: "discovery",
    name: "Discovery Cave",
    description: "Find fractions that are equal!",
    skill: "Match equivalent fractions",
    x: 52,
    y: 44,
    fractions: ["2/4", "3/6"],
  },
  {
    id: "river",
    phase: "practice",
    name: "Merge River",
    description: "Split and merge to make new fractions!",
    skill: "Split & merge mastery",
    x: 72,
    y: 30,
    fractions: ["2/6", "4/8"],
  },
  {
    id: "castle",
    phase: "assessment",
    name: "Fraction Castle",
    description: "The final fraction challenge!",
    skill: "Prove your fraction skills",
    x: 88,
    y: 12,
    fractions: ["1/3=2/6", "½=2/4"],
  },
];

const MAP_SPEECHES: Record<string, string> = {
  intro:
    "First we go to Fraction Forest, THEN through Discovery Cave, THEN across Merge River, THEN to the Castle! Say it with me!",
  exploration:
    "We made it to Fraction Forest! Look at all these fractions hiding in the trees! Next stop: Discovery Cave!",
  discovery:
    "Discovery Cave! Ooh, it's sparkly in here! Can you find which fractions are EQUAL? Let's explore!",
  practice:
    "Merge River! We need to hop across the stepping stones! Split and merge fractions to cross! Almost to the Castle!",
  assessment:
    "There's the Castle! Show me your fraction powers! Does ½ equal 2/4? Let's prove it!",
  celebration:
    "WE DID IT! We made it to Fraction Castle! You are a fraction EXPLORER!",
};

// ── SVG scene illustrations ──────────────────────────────────────────

function FlowerGardenScene({ glow }: { glow: boolean }) {
  return (
    <g>
      {/* Grass mound */}
      <ellipse cx="0" cy="8" rx="32" ry="10" fill={glow ? "#86efac" : "#4ade80"} opacity="0.7" />
      {/* Flowers */}
      <g transform="translate(-14, -12)">
        <circle cx="0" cy="0" r="3.5" fill="#f472b6" />
        <circle cx="0" cy="0" r="1.5" fill="#fbbf24" />
        <line x1="0" y1="3.5" x2="0" y2="12" stroke="#16a34a" strokeWidth="1.5" />
      </g>
      <g transform="translate(0, -16)">
        <circle cx="0" cy="0" r="4" fill="#fb923c" />
        <circle cx="0" cy="0" r="1.8" fill="#fef08a" />
        <line x1="0" y1="4" x2="0" y2="14" stroke="#16a34a" strokeWidth="1.5" />
      </g>
      <g transform="translate(12, -10)">
        <circle cx="0" cy="0" r="3" fill="#c084fc" />
        <circle cx="0" cy="0" r="1.3" fill="#fde68a" />
        <line x1="0" y1="3" x2="0" y2="10" stroke="#16a34a" strokeWidth="1.5" />
      </g>
      <g transform="translate(-8, -6)">
        <circle cx="0" cy="0" r="2.5" fill="#f87171" />
        <circle cx="0" cy="0" r="1" fill="#fbbf24" />
        <line x1="0" y1="2.5" x2="0" y2="8" stroke="#16a34a" strokeWidth="1.5" />
      </g>
      {/* Butterfly */}
      <g transform="translate(18, -18)">
        <ellipse cx="-3" cy="0" rx="3" ry="2" fill="#a78bfa" opacity="0.8" />
        <ellipse cx="3" cy="0" rx="3" ry="2" fill="#c4b5fd" opacity="0.8" />
        <ellipse cx="0" cy="0" rx="0.8" ry="2" fill="#4c1d95" />
      </g>
    </g>
  );
}

function FractionForestScene({ glow }: { glow: boolean }) {
  return (
    <g>
      {/* Trees */}
      <rect x="-4" y="-2" width="4" height="14" rx="1" fill="#92400e" />
      <polygon points="-8,-2 -2,-18 4,-2" fill={glow ? "#4ade80" : "#15803d"} />
      <polygon points="-6,-8 -2,-22 2,-8" fill={glow ? "#86efac" : "#166534"} />
      <rect x="10" y="0" width="3.5" height="12" rx="1" fill="#78350f" />
      <polygon points="5,0 11.75,-16 18.5,0" fill={glow ? "#22c55e" : "#14532d"} />
      {/* Mushroom */}
      <rect x="-14" y="6" width="2.5" height="5" rx="0.5" fill="#fef3c7" />
      <ellipse cx="-12.75" cy="6" rx="5" ry="3.5" fill="#ef4444" />
      <circle cx="-14" cy="5" r="1" fill="white" />
      <circle cx="-11.5" cy="4.5" r="0.7" fill="white" />
      {/* Small butterfly */}
      <g transform="translate(-18, -14)">
        <ellipse cx="-2" cy="0" rx="2" ry="1.2" fill="#fbbf24" opacity="0.7" />
        <ellipse cx="2" cy="0" rx="2" ry="1.2" fill="#fcd34d" opacity="0.7" />
        <ellipse cx="0" cy="0" rx="0.5" ry="1.2" fill="#92400e" />
      </g>
    </g>
  );
}

function DiscoveryCaveScene({ glow }: { glow: boolean }) {
  return (
    <g>
      {/* Cave entrance */}
      <path
        d="M-22,10 Q-22,-16 0,-18 Q22,-16 22,10 Z"
        fill="#57534e"
        stroke="#44403c"
        strokeWidth="1.5"
      />
      <path
        d="M-18,10 Q-18,-12 0,-14 Q18,-12 18,10 Z"
        fill="#1c1917"
      />
      {/* Stalactites */}
      <polygon points="-8,-12 -6,-4 -10,-4" fill="#78716c" />
      <polygon points="4,-14 6,-6 2,-6" fill="#78716c" />
      {/* Gems / sparkles inside */}
      <circle cx="-6" cy="2" r="2" fill={glow ? "#fbbf24" : "#a855f7"} opacity="0.9" />
      <circle cx="6" cy="-2" r="1.5" fill={glow ? "#f59e0b" : "#06b6d4"} opacity="0.8" />
      <circle cx="0" cy="4" r="1.8" fill={glow ? "#fde68a" : "#ec4899"} opacity="0.7" />
      {/* Sparkle lines */}
      <line x1="-6" y1="-1" x2="-6" y2="-4" stroke="#fbbf24" strokeWidth="0.5" opacity="0.6" />
      <line x1="6" y1="-5" x2="6" y2="-7" stroke="#22d3ee" strokeWidth="0.5" opacity="0.6" />
      <line x1="-2" y1="1" x2="2" y2="1" stroke="#f9a8d4" strokeWidth="0.5" opacity="0.6" />
    </g>
  );
}

function MergeRiverScene({ glow }: { glow: boolean }) {
  return (
    <g>
      {/* Water */}
      <path
        d="M-28,4 Q-14,-2 0,4 Q14,10 28,4 L28,14 Q14,20 0,14 Q-14,8 -28,14 Z"
        fill={glow ? "#38bdf8" : "#3b82f6"}
        opacity="0.7"
      />
      {/* Water shimmer */}
      <path
        d="M-20,8 Q-10,4 0,8 Q10,12 20,8"
        fill="none"
        stroke="white"
        strokeWidth="0.8"
        opacity="0.4"
      />
      {/* Stepping stones */}
      <ellipse cx="-14" cy="8" rx="5" ry="2.5" fill="#a8a29e" stroke="#78716c" strokeWidth="0.5" />
      <ellipse cx="0" cy="6" rx="4.5" ry="2.5" fill="#d6d3d1" stroke="#a8a29e" strokeWidth="0.5" />
      <ellipse cx="14" cy="9" rx="5" ry="2.5" fill="#a8a29e" stroke="#78716c" strokeWidth="0.5" />
      {/* Fish */}
      <g transform="translate(-8, 12)">
        <ellipse cx="0" cy="0" rx="3" ry="1.5" fill="#fb923c" />
        <polygon points="3,0 5,-2 5,2" fill="#fb923c" />
        <circle cx="-1.5" cy="-0.3" r="0.5" fill="#1e293b" />
      </g>
      {/* Reeds */}
      <line x1="-24" y1="14" x2="-24" y2="0" stroke="#16a34a" strokeWidth="1" />
      <ellipse cx="-24" cy="-1" rx="1.5" ry="3" fill="#65a30d" />
      <line x1="24" y1="14" x2="24" y2="2" stroke="#16a34a" strokeWidth="1" />
      <ellipse cx="24" cy="1" rx="1.5" ry="3" fill="#65a30d" />
    </g>
  );
}

function FractionCastleScene({ glow }: { glow: boolean }) {
  return (
    <g>
      {/* Main tower */}
      <rect x="-12" y="-14" width="24" height="26" rx="2" fill={glow ? "#c084fc" : "#7c3aed"} />
      {/* Left tower */}
      <rect x="-20" y="-8" width="10" height="20" rx="1" fill={glow ? "#a78bfa" : "#6d28d9"} />
      <polygon points="-20,-8 -15,-16 -10,-8" fill={glow ? "#e9d5ff" : "#8b5cf6"} />
      {/* Right tower */}
      <rect x="10" y="-8" width="10" height="20" rx="1" fill={glow ? "#a78bfa" : "#6d28d9"} />
      <polygon points="10,-8 15,-16 20,-8" fill={glow ? "#e9d5ff" : "#8b5cf6"} />
      {/* Roof */}
      <polygon points="-14,-14 0,-26 14,-14" fill={glow ? "#ddd6fe" : "#8b5cf6"} />
      {/* Door */}
      <path d="M-4,12 L-4,2 Q0,-3 4,2 L4,12 Z" fill="#fbbf24" />
      {/* Windows */}
      <rect x="-8" y="-6" width="4" height="5" rx="1" fill="#fef08a" opacity="0.8" />
      <rect x="4" y="-6" width="4" height="5" rx="1" fill="#fef08a" opacity="0.8" />
      {/* Flags */}
      <line x1="0" y1="-26" x2="0" y2="-34" stroke="#78350f" strokeWidth="1" />
      <polygon points="0,-34 8,-31 0,-28" fill="#ef4444" />
      <line x1="-15" y1="-16" x2="-15" y2="-22" stroke="#78350f" strokeWidth="0.8" />
      <polygon points="-15,-22 -10,-20 -15,-18" fill="#3b82f6" />
      <line x1="15" y1="-16" x2="15" y2="-22" stroke="#78350f" strokeWidth="0.8" />
      <polygon points="15,-22 20,-20 15,-18" fill="#22c55e" />
      {/* Battlements */}
      {[-10, -6, -2, 2, 6, 10].map((bx) => (
        <rect key={bx} x={bx - 1.5} y={-16} width="3" height="3" fill={glow ? "#c084fc" : "#7c3aed"} />
      ))}
    </g>
  );
}

// ── Map character (the scroll with face) ─────────────────────────────

function MapCharacterFace() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      {/* Scroll body */}
      <rect x="8" y="12" width="40" height="36" rx="4" fill="#f5e6c8" stroke="#c2956b" strokeWidth="1.5" />
      {/* Scroll top roll */}
      <rect x="4" y="8" width="48" height="8" rx="4" fill="#dcc5a0" stroke="#b8975a" strokeWidth="1" />
      {/* Scroll bottom roll */}
      <rect x="4" y="44" width="48" height="6" rx="3" fill="#dcc5a0" stroke="#b8975a" strokeWidth="1" />
      {/* Left eye — googly */}
      <circle cx="20" cy="26" r="6" fill="white" stroke="#333" strokeWidth="1" />
      <motion.circle
        cx="20" cy="26" r="3"
        fill="#1e293b"
        animate={{ cx: [19, 21, 20, 19], cy: [25, 27, 26, 25] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
      />
      <circle cx="18.5" cy="24.5" r="1" fill="white" />
      {/* Right eye — googly */}
      <circle cx="36" cy="26" r="6" fill="white" stroke="#333" strokeWidth="1" />
      <motion.circle
        cx="36" cy="26" r="3"
        fill="#1e293b"
        animate={{ cx: [35, 37, 36, 35], cy: [25, 27, 26, 25] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.2 }}
      />
      <circle cx="34.5" cy="24.5" r="1" fill="white" />
      {/* Smile */}
      <path d="M18 36 Q28 44 38 36" stroke="#78350f" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <ellipse cx="14" cy="33" rx="3" ry="2" fill="#fca5a5" opacity="0.5" />
      <ellipse cx="42" cy="33" rx="3" ry="2" fill="#fca5a5" opacity="0.5" />
    </svg>
  );
}

// ── Winding path SVG ─────────────────────────────────────────────────

function WindingTrailPath({
  locations,
  activeIdx,
}: {
  locations: MapLocation[];
  activeIdx: number;
}) {
  // Build a smooth curve through all locations
  const pts = locations.map((l) => ({ x: l.x, y: l.y }));
  let pathD = `M ${pts[0].x} ${pts[0].y}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i];
    const next = pts[i + 1];
    const midX = (curr.x + next.x) / 2;
    // Alternate control points for winding effect
    const cpOffsetX = i % 2 === 0 ? 8 : -8;
    const cpOffsetY = i % 2 === 0 ? -6 : 6;
    const cp1x = midX + cpOffsetX;
    const cp1y = (curr.y + next.y) / 2 + cpOffsetY;
    pathD += ` Q ${cp1x} ${cp1y} ${next.x} ${next.y}`;
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {/* Trail shadow */}
      <path
        d={pathD}
        fill="none"
        stroke="#92400e"
        strokeWidth="2.8"
        strokeLinecap="round"
        opacity="0.2"
      />
      {/* Main dirt trail — completed portion */}
      <path
        d={pathD}
        fill="none"
        stroke="#d4a76a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1.5 1"
        opacity="0.9"
      />
      {/* Dashed future portion overlay */}
      {locations.slice(0, -1).map((loc, i) => {
        const next = locations[i + 1];
        const isPast = i < activeIdx;
        const midX = (loc.x + next.x) / 2;
        const cpOffsetX = i % 2 === 0 ? 8 : -8;
        const cpOffsetY = i % 2 === 0 ? -6 : 6;
        const cp1x = midX + cpOffsetX;
        const cp1y = (loc.y + next.y) / 2 + cpOffsetY;
        const segPath = `M ${loc.x} ${loc.y} Q ${cp1x} ${cp1y} ${next.x} ${next.y}`;

        return isPast ? (
          <path
            key={loc.id}
            d={segPath}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.9"
          />
        ) : null;
      })}
    </svg>
  );
}

// ── Main Component ───────────────────────────────────────────────────

interface FractionMapProps {
  show: boolean;
  currentPhase: string;
  completedChallenges: number;
  onClose: () => void;
  characterId?: string;
}

const SCENE_COMPONENTS: Record<string, React.FC<{ glow: boolean }>> = {
  base: FlowerGardenScene,
  forest: FractionForestScene,
  cave: DiscoveryCaveScene,
  river: MergeRiverScene,
  castle: FractionCastleScene,
};

export default function FractionMap({
  show,
  currentPhase,
  completedChallenges,
  onClose,
  characterId,
}: FractionMapProps) {
  const currentIndex = MAP_LOCATIONS.findIndex((l) => l.phase === currentPhase);
  const activeIdx = currentIndex >= 0 ? currentIndex : 0;
  const speech = MAP_SPEECHES[currentPhase] || MAP_SPEECHES.intro;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />

          {/* Map scroll container */}
          <motion.div
            initial={{ scale: 0.15, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.15, opacity: 0, rotate: 15 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="relative m-3 sm:m-5 flex-1 overflow-hidden"
          >
            {/* ── Wooden frame border ── */}
            <div className="absolute inset-0 rounded-2xl border-[6px] sm:border-[8px] border-amber-800 shadow-[0_0_0_2px_#92400e,0_8px_32px_rgba(0,0,0,0.4)] z-10 pointer-events-none" />
            <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_12px_rgba(120,53,15,0.3)] z-10 pointer-events-none" />

            {/* ── Parchment background ── */}
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, #f5e6c8 0%, #edd9b5 25%, #f0dfc0 50%, #e8cfa0 75%, #f5e6c8 100%)",
              }}
            />
            {/* Paper texture overlay */}
            <div
              className="absolute inset-0 rounded-xl opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            {/* Burnt / aged edges */}
            <div className="absolute inset-0 rounded-xl pointer-events-none" style={{
              boxShadow: "inset 0 0 40px rgba(139, 69, 19, 0.15), inset 0 0 80px rgba(139, 69, 19, 0.08)",
            }} />

            {/* ── Decorative corner curls ── */}
            <svg className="absolute top-0 left-0 w-12 h-12 pointer-events-none z-10 opacity-30" viewBox="0 0 48 48">
              <path d="M0 48 Q0 0 48 0" fill="none" stroke="#8b4513" strokeWidth="2" />
              <path d="M4 48 Q4 4 48 4" fill="none" stroke="#8b4513" strokeWidth="1" />
            </svg>
            <svg className="absolute top-0 right-0 w-12 h-12 pointer-events-none z-10 opacity-30" viewBox="0 0 48 48">
              <path d="M48 48 Q48 0 0 0" fill="none" stroke="#8b4513" strokeWidth="2" />
              <path d="M44 48 Q44 4 0 4" fill="none" stroke="#8b4513" strokeWidth="1" />
            </svg>
            <svg className="absolute bottom-0 left-0 w-12 h-12 pointer-events-none z-10 opacity-30" viewBox="0 0 48 48">
              <path d="M0 0 Q0 48 48 48" fill="none" stroke="#8b4513" strokeWidth="2" />
              <path d="M4 0 Q4 44 48 44" fill="none" stroke="#8b4513" strokeWidth="1" />
            </svg>
            <svg className="absolute bottom-0 right-0 w-12 h-12 pointer-events-none z-10 opacity-30" viewBox="0 0 48 48">
              <path d="M48 0 Q48 48 0 48" fill="none" stroke="#8b4513" strokeWidth="2" />
              <path d="M44 0 Q44 44 0 44" fill="none" stroke="#8b4513" strokeWidth="1" />
            </svg>

            {/* ── Compass rose (top-right) ── */}
            <div className="absolute top-12 right-5 sm:top-14 sm:right-7 opacity-20 pointer-events-none z-[1]">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="22" fill="none" stroke="#8b4513" strokeWidth="1" />
                <polygon points="24,4 26,20 24,24 22,20" fill="#8b4513" />
                <polygon points="24,44 22,28 24,24 26,28" fill="#b8975a" />
                <polygon points="4,24 20,22 24,24 20,26" fill="#b8975a" />
                <polygon points="44,24 28,26 24,24 28,22" fill="#b8975a" />
                <text x="24" y="3" textAnchor="middle" fontSize="5" fill="#8b4513" fontWeight="bold">N</text>
              </svg>
            </div>

            {/* ── Winding dirt trail ── */}
            <WindingTrailPath locations={MAP_LOCATIONS} activeIdx={activeIdx} />

            {/* ── Scattered fraction pieces along the trail ── */}
            {[
              { text: "½", x: 20, y: 74, delay: 0.5 },
              { text: "¼", x: 24, y: 68, delay: 0.7 },
              { text: "⅓", x: 40, y: 54, delay: 0.9 },
              { text: "2/4", x: 44, y: 48, delay: 1.1 },
              { text: "¾", x: 58, y: 38, delay: 1.3 },
              { text: "⅔", x: 62, y: 34, delay: 0.6 },
              { text: "3/6", x: 68, y: 28, delay: 0.8 },
              { text: "4/8", x: 80, y: 20, delay: 1.0 },
            ].map((frac, i) => {
              const collected =
                frac.y >= (MAP_LOCATIONS[activeIdx]?.y ?? 100);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: collected ? 0.9 : 0.5,
                    scale: 1,
                    y: collected ? 0 : [0, -3, 0],
                  }}
                  transition={{
                    opacity: { delay: frac.delay, duration: 0.4 },
                    scale: { delay: frac.delay, type: "spring" },
                    y: {
                      repeat: Infinity,
                      duration: 2 + i * 0.2,
                      ease: "easeInOut",
                      delay: frac.delay,
                    },
                  }}
                  className="absolute pointer-events-none"
                  style={{ left: `${frac.x}%`, top: `${frac.y}%` }}
                >
                  <div
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border ${
                      collected
                        ? "bg-amber-500/90 text-white border-amber-400 shadow-amber-400/30 shadow-md"
                        : "bg-amber-100/60 text-amber-700/60 border-amber-300/40"
                    }`}
                    style={{
                      fontFamily: "'Comic Sans MS', 'Chalkboard SE', cursive",
                    }}
                  >
                    {collected && <span className="text-[7px] mr-0.5">★</span>}
                    {frac.text}
                  </div>
                </motion.div>
              );
            })}

            {/* ── Location landmarks ── */}
            {MAP_LOCATIONS.map((loc, i) => {
              const isPast = i < activeIdx;
              const isActive = i === activeIdx;
              const isFuture = i > activeIdx;
              const SceneComp = SCENE_COMPONENTS[loc.id];

              return (
                <div
                  key={loc.id}
                  className="absolute"
                  style={{
                    left: `${loc.x}%`,
                    top: `${loc.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {/* SVG scene illustration */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.12, type: "spring" }}
                    className={isFuture ? "opacity-30" : ""}
                    style={{ filter: isFuture ? "grayscale(0.6)" : "none" }}
                  >
                    <svg
                      width="72"
                      height="56"
                      viewBox="-28 -36 56 48"
                      className="overflow-visible"
                    >
                      {SceneComp && <SceneComp glow={isPast} />}
                    </svg>
                  </motion.div>

                  {/* Gold star badge for completed */}
                  {isPast && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 500 }}
                      className="absolute -top-2 -right-2 z-10"
                    >
                      <div className="w-7 h-7 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-400/40 border-2 border-yellow-200">
                        <span className="text-white text-xs font-black drop-shadow">★</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Active location glow ring */}
                  {isActive && (
                    <motion.div
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.6, 0.2, 0.6],
                      }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 rounded-full border-2 border-orange-400 pointer-events-none"
                      style={{
                        left: "50%",
                        top: "50%",
                        width: 60,
                        height: 60,
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  )}

                  {/* Character avatar bouncing on active location */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, y: 10 }}
                      animate={{
                        scale: 1,
                        y: [-8, -18, -8],
                      }}
                      transition={{
                        scale: { delay: 0.4, type: "spring", stiffness: 400 },
                        y: {
                          repeat: Infinity,
                          duration: 1.5,
                          ease: "easeInOut",
                        },
                      }}
                      className="absolute left-1/2 -translate-x-1/2"
                      style={{ top: -28 }}
                    >
                      <div className="relative">
                        <TutorAvatar
                          size={36}
                          animate
                          characterId={characterId}
                        />
                        {/* Little bouncing shadow */}
                        <motion.div
                          animate={{ scaleX: [1, 0.7, 1], opacity: [0.3, 0.15, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-black/20 rounded-full"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Location name on parchment ribbon */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className={`absolute top-full mt-0.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-center ${
                      isFuture ? "opacity-40" : ""
                    }`}
                  >
                    <div
                      className={`relative px-2 py-0.5 rounded-md ${
                        isActive
                          ? "bg-amber-600/90 text-white shadow-md"
                          : isPast
                          ? "bg-amber-500/70 text-white"
                          : "bg-amber-900/20 text-amber-900/50"
                      }`}
                    >
                      <p
                        className="text-[9px] sm:text-[11px] font-black tracking-wide"
                        style={{
                          fontFamily:
                            "'Comic Sans MS', 'Chalkboard SE', cursive",
                        }}
                      >
                        {loc.name}
                      </p>
                    </div>
                    {isActive && (
                      <p
                        className="text-[7px] sm:text-[8px] text-amber-800 font-bold mt-0.5"
                        style={{
                          fontFamily:
                            "'Comic Sans MS', 'Chalkboard SE', cursive",
                        }}
                      >
                        {loc.skill}
                      </p>
                    )}
                  </motion.div>
                </div>
              );
            })}

            {/* ── Map Character (top-left) — the scroll with googly eyes ── */}
            <motion.div
              initial={{ x: -80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20"
            >
              <motion.div
                animate={{ rotate: [-3, 3, -3] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <MapCharacterFace />
              </motion.div>
            </motion.div>

            {/* ── Map title banner ── */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
              <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="relative"
              >
                {/* Ribbon */}
                <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 px-6 py-1.5 rounded-lg shadow-lg border-2 border-amber-500/60 relative">
                  <h2
                    className="text-sm sm:text-base font-black text-amber-100 tracking-widest drop-shadow"
                    style={{
                      fontFamily: "'Comic Sans MS', 'Chalkboard SE', cursive",
                      textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                    }}
                  >
                    THE MAP
                  </h2>
                  {/* Ribbon tails */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-b-[10px] border-r-[8px] border-t-transparent border-b-transparent border-r-amber-700" />
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-b-[10px] border-l-[8px] border-t-transparent border-b-transparent border-l-amber-700" />
                </div>
              </motion.div>
            </div>

            {/* ── Speech bubble from Map character ── */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
              className="absolute bottom-3 left-3 right-3 z-20"
            >
              <div
                className="relative rounded-2xl px-4 py-3 shadow-lg border-2 border-amber-700/30"
                style={{
                  background:
                    "linear-gradient(to bottom, #fef3c7, #fde68a)",
                }}
              >
                {/* Speech bubble pointer toward Map character */}
                <div
                  className="absolute -top-2 left-8 w-4 h-4 rotate-45 border-l-2 border-t-2 border-amber-700/30"
                  style={{ background: "#fef3c7" }}
                />
                <div className="flex items-start gap-2.5">
                  <div className="shrink-0 mt-0.5">
                    <svg width="24" height="24" viewBox="0 0 56 56" fill="none">
                      <rect x="8" y="12" width="40" height="36" rx="4" fill="#f5e6c8" stroke="#c2956b" strokeWidth="1.5" />
                      <rect x="4" y="8" width="48" height="8" rx="4" fill="#dcc5a0" stroke="#b8975a" strokeWidth="1" />
                      <rect x="4" y="44" width="48" height="6" rx="3" fill="#dcc5a0" stroke="#b8975a" strokeWidth="1" />
                      <circle cx="20" cy="26" r="4" fill="white" stroke="#333" strokeWidth="0.8" />
                      <circle cx="20" cy="26" r="2" fill="#1e293b" />
                      <circle cx="36" cy="26" r="4" fill="white" stroke="#333" strokeWidth="0.8" />
                      <circle cx="36" cy="26" r="2" fill="#1e293b" />
                      <path d="M20 36 Q28 42 36 36" stroke="#78350f" strokeWidth="1.5" fill="none" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p
                      className="text-[9px] font-black text-amber-700 mb-0.5 tracking-wider"
                      style={{
                        fontFamily:
                          "'Comic Sans MS', 'Chalkboard SE', cursive",
                      }}
                    >
                      THE MAP SAYS:
                    </p>
                    <p
                      className="text-xs sm:text-sm font-bold text-amber-900 leading-snug"
                      style={{
                        fontFamily:
                          "'Comic Sans MS', 'Chalkboard SE', cursive",
                      }}
                    >
                      {speech}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Close button ── */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.1 }}
              onClick={onClose}
              className="absolute top-3 right-3 z-30 w-9 h-9 bg-amber-800 hover:bg-amber-700 rounded-full flex items-center justify-center shadow-lg text-amber-100 font-black text-sm border-2 border-amber-600 transition-colors"
            >
              ✕
            </motion.button>

            {/* ── Ambient sparkles ── */}
            {[
              { x: 8, y: 20, delay: 0, size: 3 },
              { x: 45, y: 15, delay: 0.7, size: 2.5 },
              { x: 75, y: 50, delay: 1.2, size: 2 },
              { x: 92, y: 35, delay: 0.4, size: 3 },
              { x: 25, y: 40, delay: 1.5, size: 2 },
              { x: 60, y: 70, delay: 0.9, size: 2.5 },
            ].map((sparkle, i) => (
              <motion.div
                key={`sparkle-${i}`}
                animate={{
                  opacity: [0, 0.8, 0],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5,
                  delay: sparkle.delay,
                  ease: "easeInOut",
                }}
                className="absolute pointer-events-none"
                style={{
                  left: `${sparkle.x}%`,
                  top: `${sparkle.y}%`,
                  width: sparkle.size * 2,
                  height: sparkle.size * 2,
                }}
              >
                <svg
                  viewBox="0 0 12 12"
                  width={sparkle.size * 4}
                  height={sparkle.size * 4}
                >
                  <path
                    d="M6 0 L7 4.5 L12 6 L7 7.5 L6 12 L5 7.5 L0 6 L5 4.5 Z"
                    fill="#fbbf24"
                    opacity="0.7"
                  />
                </svg>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
