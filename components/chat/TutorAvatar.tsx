"use client";

import { motion } from "framer-motion";

interface TutorAvatarProps {
  size?: number;
  animate?: boolean; // true when speaking
  characterId?: string; // "frax" | "luna" | "rex" | "pip" | "growl"
  className?: string;
}

// ── Frax the Fox ──────────────────────────────────────────────────────
function FraxFace({ animate }: { animate: boolean }) {
  return (
    <>
      {/* Background */}
      <circle cx="32" cy="32" r="32" fill="url(#frax-bg)" />

      {/* Ears */}
      <path d="M14 12 L22 26 L8 24 Z" fill="#F97316" stroke="#EA580C" strokeWidth="1" />
      <path d="M50 12 L42 26 L56 24 Z" fill="#F97316" stroke="#EA580C" strokeWidth="1" />
      <path d="M15.5 16 L21 25 L11 23.5 Z" fill="#FDBA74" />
      <path d="M48.5 16 L43 25 L53 23.5 Z" fill="#FDBA74" />

      {/* Face */}
      <ellipse cx="32" cy="36" rx="18" ry="16" fill="#FB923C" />
      <ellipse cx="32" cy="40" rx="12" ry="10" fill="#FFF7ED" />

      {/* Eyes */}
      {animate ? (
        <>
          <path d="M22 33 Q25 30 28 33" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M36 33 Q39 30 42 33" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <ellipse cx="25" cy="33" rx="3" ry="3.5" fill="#1E293B" />
          <ellipse cx="39" cy="33" rx="3" ry="3.5" fill="#1E293B" />
          <circle cx="26.5" cy="31.5" r="1.2" fill="white" />
          <circle cx="40.5" cy="31.5" r="1.2" fill="white" />
        </>
      )}

      {/* Nose */}
      <ellipse cx="32" cy="38" rx="2.5" ry="2" fill="#1E293B" />

      {/* Mouth */}
      {animate ? (
        <motion.ellipse
          cx="32" cy="43" rx="4" fill="#1E293B"
          animate={{ ry: [2, 4, 1.5, 3.5, 2] }}
          transition={{ repeat: Infinity, duration: 0.35, ease: "easeInOut" }}
        />
      ) : (
        <path d="M28 41 Q32 45 36 41" stroke="#1E293B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      )}

      {/* Blush */}
      <ellipse cx="21" cy="38" rx="3" ry="2" fill="#FBBF24" opacity="0.3" />
      <ellipse cx="43" cy="38" rx="3" ry="2" fill="#FBBF24" opacity="0.3" />

      <defs>
        <linearGradient id="frax-bg" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
    </>
  );
}

// ── Luna the Fairy ────────────────────────────────────────────────────
function LunaFace({ animate }: { animate: boolean }) {
  return (
    <>
      {/* Background — sparkly purple */}
      <circle cx="32" cy="32" r="32" fill="url(#luna-bg)" />

      {/* Wings */}
      <motion.path
        d="M8 30 Q2 20 10 14 Q16 18 14 28 Z"
        fill="#E9D5FF" opacity="0.7" stroke="#C084FC" strokeWidth="0.5"
        animate={animate ? { d: ["M8 30 Q2 20 10 14 Q16 18 14 28 Z", "M6 28 Q0 17 10 12 Q18 16 14 28 Z", "M8 30 Q2 20 10 14 Q16 18 14 28 Z"] } : {}}
        transition={{ repeat: Infinity, duration: 0.8 }}
      />
      <motion.path
        d="M56 30 Q62 20 54 14 Q48 18 50 28 Z"
        fill="#E9D5FF" opacity="0.7" stroke="#C084FC" strokeWidth="0.5"
        animate={animate ? { d: ["M56 30 Q62 20 54 14 Q48 18 50 28 Z", "M58 28 Q64 17 54 12 Q46 16 50 28 Z", "M56 30 Q62 20 54 14 Q48 18 50 28 Z"] } : {}}
        transition={{ repeat: Infinity, duration: 0.8 }}
      />

      {/* Face — round, soft pink */}
      <circle cx="32" cy="35" r="17" fill="#FDE8EF" />

      {/* Hair puffs */}
      <circle cx="20" cy="22" r="6" fill="#D8B4FE" />
      <circle cx="32" cy="19" r="7" fill="#C084FC" />
      <circle cx="44" cy="22" r="6" fill="#D8B4FE" />
      <circle cx="26" cy="20" r="5" fill="#E9D5FF" />
      <circle cx="38" cy="20" r="5" fill="#E9D5FF" />

      {/* Crown / tiara */}
      <path d="M24 22 L26 16 L29 20 L32 14 L35 20 L38 16 L40 22" fill="none" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="32" cy="14" r="1.5" fill="#FBBF24" />

      {/* Eyes — big, sparkly */}
      {animate ? (
        <>
          <path d="M23 34 Q26 31 29 34" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M35 34 Q38 31 41 34" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <ellipse cx="26" cy="34" rx="3.5" ry="4" fill="#7C3AED" />
          <ellipse cx="38" cy="34" rx="3.5" ry="4" fill="#7C3AED" />
          <circle cx="27.5" cy="32.5" r="1.5" fill="white" />
          <circle cx="39.5" cy="32.5" r="1.5" fill="white" />
          {/* Star sparkles in eyes */}
          <circle cx="24.5" cy="33" r="0.6" fill="#FBBF24" />
          <circle cx="36.5" cy="33" r="0.6" fill="#FBBF24" />
        </>
      )}

      {/* Nose — tiny dot */}
      <circle cx="32" cy="38" r="1.2" fill="#E879F9" />

      {/* Mouth */}
      {animate ? (
        <motion.ellipse
          cx="32" cy="42" rx="3.5" fill="#E879F9"
          animate={{ ry: [1.5, 3, 1, 2.5, 1.5] }}
          transition={{ repeat: Infinity, duration: 0.3, ease: "easeInOut" }}
        />
      ) : (
        <path d="M29 41 Q32 44 35 41" stroke="#E879F9" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      )}

      {/* Cheek blush */}
      <ellipse cx="21" cy="39" rx="3.5" ry="2" fill="#F9A8D4" opacity="0.5" />
      <ellipse cx="43" cy="39" rx="3.5" ry="2" fill="#F9A8D4" opacity="0.5" />

      {/* Sparkles */}
      <motion.circle cx="12" cy="10" r="1" fill="#FBBF24"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
      />
      <motion.circle cx="52" cy="8" r="1.2" fill="#F9A8D4"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
      />
      <motion.circle cx="8" cy="50" r="0.8" fill="#C084FC"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 1 }}
      />

      <defs>
        <linearGradient id="luna-bg" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
    </>
  );
}

// ── Rex the Robot ─────────────────────────────────────────────────────
function RexFace({ animate }: { animate: boolean }) {
  return (
    <>
      {/* Background — techy blue */}
      <circle cx="32" cy="32" r="32" fill="url(#rex-bg)" />

      {/* Antenna */}
      <line x1="32" y1="8" x2="32" y2="16" stroke="#94A3B8" strokeWidth="2" />
      <motion.circle cx="32" cy="7" r="3" fill="#22D3EE"
        animate={animate ? { fill: ["#22D3EE", "#F43F5E", "#22D3EE", "#FBBF24", "#22D3EE"] } : { fill: "#22D3EE" }}
        transition={{ repeat: Infinity, duration: 0.5 }}
      />

      {/* Head — boxy rounded */}
      <rect x="12" y="18" width="40" height="32" rx="8" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />

      {/* Face plate */}
      <rect x="16" y="22" width="32" height="24" rx="5" fill="#E2E8F0" />

      {/* Eyes — LED screens */}
      {animate ? (
        <>
          <motion.rect x="20" y="28" width="8" height="6" rx="1" fill="#22D3EE"
            animate={{ opacity: [1, 0.3, 1], scaleY: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 0.25, ease: "easeInOut" }}
          />
          <motion.rect x="36" y="28" width="8" height="6" rx="1" fill="#22D3EE"
            animate={{ opacity: [1, 0.3, 1], scaleY: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 0.25, ease: "easeInOut", delay: 0.1 }}
          />
        </>
      ) : (
        <>
          <rect x="20" y="28" width="8" height="6" rx="1" fill="#22D3EE" />
          <rect x="36" y="28" width="8" height="6" rx="1" fill="#22D3EE" />
          {/* Pixel highlights */}
          <rect x="21" y="29" width="2" height="2" fill="white" opacity="0.6" />
          <rect x="37" y="29" width="2" height="2" fill="white" opacity="0.6" />
        </>
      )}

      {/* Mouth — speaker grille */}
      {animate ? (
        <g>
          <motion.rect x="24" y="38" width="16" height="5" rx="2" fill="#64748B"
            animate={{ height: [5, 7, 4, 6, 5] }}
            transition={{ repeat: Infinity, duration: 0.3 }}
          />
          {/* Sound waves */}
          <motion.path d="M22 40 Q20 38 22 36" stroke="#22D3EE" strokeWidth="1" fill="none"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
          />
          <motion.path d="M42 40 Q44 38 42 36" stroke="#22D3EE" strokeWidth="1" fill="none"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.5, delay: 0.25 }}
          />
        </g>
      ) : (
        <>
          <rect x="24" y="38" width="16" height="5" rx="2" fill="#64748B" />
          {/* Grille lines */}
          <line x1="28" y1="38" x2="28" y2="43" stroke="#94A3B8" strokeWidth="0.5" />
          <line x1="32" y1="38" x2="32" y2="43" stroke="#94A3B8" strokeWidth="0.5" />
          <line x1="36" y1="38" x2="36" y2="43" stroke="#94A3B8" strokeWidth="0.5" />
        </>
      )}

      {/* Bolts */}
      <circle cx="14" cy="34" r="2.5" fill="#94A3B8" stroke="#64748B" strokeWidth="0.5" />
      <circle cx="50" cy="34" r="2.5" fill="#94A3B8" stroke="#64748B" strokeWidth="0.5" />

      <defs>
        <linearGradient id="rex-bg" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
      </defs>
    </>
  );
}

// ── Pip the Mouse ─────────────────────────────────────────────────────
function PipFace({ animate }: { animate: boolean }) {
  return (
    <>
      {/* Background — warm green */}
      <circle cx="32" cy="32" r="32" fill="url(#pip-bg)" />

      {/* Big ears */}
      <motion.ellipse cx="16" cy="22" rx="10" ry="12" fill="#D6D3D1" stroke="#A8A29E" strokeWidth="1"
        animate={animate ? { rotate: [-5, 5, -5] } : {}}
        transition={{ repeat: Infinity, duration: 0.4 }}
      />
      <motion.ellipse cx="48" cy="22" rx="10" ry="12" fill="#D6D3D1" stroke="#A8A29E" strokeWidth="1"
        animate={animate ? { rotate: [5, -5, 5] } : {}}
        transition={{ repeat: Infinity, duration: 0.4 }}
      />
      {/* Inner ears */}
      <ellipse cx="16" cy="22" rx="6" ry="8" fill="#FECACA" />
      <ellipse cx="48" cy="22" rx="6" ry="8" fill="#FECACA" />

      {/* Face — round, soft gray */}
      <circle cx="32" cy="37" r="17" fill="#E7E5E4" />

      {/* Eyes — big, cute */}
      {animate ? (
        <>
          <path d="M23 34 Q26 30 29 34" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M35 34 Q38 30 41 34" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <ellipse cx="26" cy="34" rx="4" ry="4.5" fill="#1E293B" />
          <ellipse cx="38" cy="34" rx="4" ry="4.5" fill="#1E293B" />
          <circle cx="27.5" cy="32" r="1.8" fill="white" />
          <circle cx="39.5" cy="32" r="1.8" fill="white" />
        </>
      )}

      {/* Nose — pink button */}
      <ellipse cx="32" cy="39" rx="2.5" ry="2" fill="#FDA4AF" />

      {/* Whiskers */}
      <line x1="14" y1="38" x2="24" y2="39" stroke="#A8A29E" strokeWidth="0.8" />
      <line x1="14" y1="41" x2="24" y2="41" stroke="#A8A29E" strokeWidth="0.8" />
      <line x1="40" y1="39" x2="50" y2="38" stroke="#A8A29E" strokeWidth="0.8" />
      <line x1="40" y1="41" x2="50" y2="41" stroke="#A8A29E" strokeWidth="0.8" />

      {/* Mouth */}
      {animate ? (
        <motion.ellipse
          cx="32" cy="43" rx="3" fill="#FDA4AF"
          animate={{ ry: [1, 2.5, 0.8, 2, 1] }}
          transition={{ repeat: Infinity, duration: 0.3, ease: "easeInOut" }}
        />
      ) : (
        <>
          <path d="M30 42 Q32 44 34 42" stroke="#A8A29E" strokeWidth="1" fill="none" strokeLinecap="round" />
          {/* Buck teeth */}
          <rect x="30.5" y="42" width="1.3" height="2" rx="0.5" fill="white" stroke="#D6D3D1" strokeWidth="0.3" />
          <rect x="32.2" y="42" width="1.3" height="2" rx="0.5" fill="white" stroke="#D6D3D1" strokeWidth="0.3" />
        </>
      )}

      {/* Blush */}
      <ellipse cx="21" cy="40" rx="3" ry="1.8" fill="#FECACA" opacity="0.5" />
      <ellipse cx="43" cy="40" rx="3" ry="1.8" fill="#FECACA" opacity="0.5" />

      <defs>
        <linearGradient id="pip-bg" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
      </defs>
    </>
  );
}

// ── Growl the Bear ────────────────────────────────────────────────────
function GrowlFace({ animate }: { animate: boolean }) {
  return (
    <>
      {/* Background — earthy brown */}
      <circle cx="32" cy="32" r="32" fill="url(#growl-bg)" />

      {/* Round ears */}
      <circle cx="16" cy="18" r="8" fill="#A16207" stroke="#854D0E" strokeWidth="1" />
      <circle cx="48" cy="18" r="8" fill="#A16207" stroke="#854D0E" strokeWidth="1" />
      <circle cx="16" cy="18" r="4.5" fill="#D4A76A" />
      <circle cx="48" cy="18" r="4.5" fill="#D4A76A" />

      {/* Face — big round brown */}
      <circle cx="32" cy="36" r="19" fill="#B45309" />

      {/* Muzzle — lighter */}
      <ellipse cx="32" cy="41" rx="11" ry="9" fill="#D4A76A" />

      {/* Eyes — small, friendly */}
      {animate ? (
        <>
          <path d="M23 33 Q26 30 29 33" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M35 33 Q38 30 41 33" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <ellipse cx="25" cy="33" rx="2.5" ry="3" fill="#1E293B" />
          <ellipse cx="39" cy="33" rx="2.5" ry="3" fill="#1E293B" />
          <circle cx="26" cy="31.5" r="1" fill="white" />
          <circle cx="40" cy="31.5" r="1" fill="white" />
        </>
      )}

      {/* Nose — big round bear nose */}
      <ellipse cx="32" cy="38.5" rx="4" ry="3" fill="#1E293B" />
      <ellipse cx="31" cy="37.5" rx="1.5" ry="1" fill="#475569" opacity="0.5" />

      {/* Mouth */}
      {animate ? (
        <motion.ellipse
          cx="32" cy="44" rx="5" fill="#854D0E"
          animate={{ ry: [2, 4.5, 1.5, 3.5, 2] }}
          transition={{ repeat: Infinity, duration: 0.4, ease: "easeInOut" }}
        />
      ) : (
        <path d="M27 43 Q32 47 37 43" stroke="#854D0E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      )}

      {/* Blush */}
      <ellipse cx="20" cy="39" rx="3.5" ry="2" fill="#F59E0B" opacity="0.25" />
      <ellipse cx="44" cy="39" rx="3.5" ry="2" fill="#F59E0B" opacity="0.25" />

      <defs>
        <linearGradient id="growl-bg" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
      </defs>
    </>
  );
}

// ── Character name mapping ────────────────────────────────────────────

const CHARACTER_FACES: Record<string, React.FC<{ animate: boolean }>> = {
  frax: FraxFace,
  luna: LunaFace,
  rex: RexFace,
  pip: PipFace,
  growl: GrowlFace,
};

// ── Main Component ────────────────────────────────────────────────────

export default function TutorAvatar({
  size = 32,
  animate = false,
  characterId = "frax",
  className = "",
}: TutorAvatarProps) {
  const Face = CHARACTER_FACES[characterId] ?? FraxFace;

  return (
    <div
      className={className}
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <Face animate={animate} />
      </svg>
    </div>
  );
}
