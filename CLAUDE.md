# Synthesis Tutor — Fraction Explorer

## Project
iPad-first web app teaching fraction equivalence to kids (ages 5-8). Conversational AI tutor "Frax" + interactive manipulatives.

## Tech Stack
- **Next.js 16.1.6** with Turbopack, App Router
- **Tailwind CSS v4** (`@import "tailwindcss"` + `@theme` block)
- **framer-motion** for animations — multi-keyframe MUST use `type: "tween"`
- **@dnd-kit/core** for drag-and-drop
- **Vercel AI SDK** (`ai` package) for chat streaming
- **fraction.js** for exact fraction math
- **Web Audio API** for procedural sounds (no audio files)

## Dev Server
```
cd /Users/yash/Downloads/synthesis-tutor
npx next dev --turbopack --port 3002
```
Test on iPad: `http://<mac-ip>:3002/lesson`

## Key Architecture
- `app/lesson/page.tsx` — Main lesson page, state management, AI chat
- `components/manipulative/FractionWorkspace.tsx` — Block shelf + challenge tabs + DnD context
- `components/manipulative/FractionPiece.tsx` — Individual draggable fraction block
- `components/manipulative/FractionBar.tsx` — Visual bar with label (DO NOT duplicate labels)
- `components/manipulative/ComparisonZone.tsx` — Drop zones for comparing fractions
- `components/manipulative/PizzaChallenge.tsx` — Pizza slicing game
- `components/manipulative/FractionBattle.tsx` — Vs bot comparison game
- `components/manipulative/TowerChallenge.tsx` — Stack to 1 whole
- `components/manipulative/RecipeChallenge.tsx` — Recipe ingredient matching
- `lib/fractions.ts` — AVAILABLE_FRACTIONS, colors, math helpers
- `lib/sounds.ts` — Web Audio procedural sounds
- `lib/ai/system-prompt.ts` — Frax tutor personality and lesson flow

## Critical Rules
1. **No `layout` prop on motion.div inside DnD contexts** — corrupts `getBoundingClientRect()` used by @dnd-kit
2. **No `overflow-hidden` on droppable containers** — clips droppable detection
3. **FractionBar already renders the fraction label** — never add a second label in FractionPiece
4. **Multi-keyframe framer-motion animations MUST use `type: "tween"`** — spring doesn't support keyframes
5. **Side effects (sounds) must NOT go inside `setState` updaters**
6. **Bot pool must only use fractions students can drag** — keep BOT_POOL in sync with AVAILABLE_FRACTIONS
7. **Pizza orders must only use fractions students have** — check against available pool
8. **Voice is on by default** — kids app, voice-first interaction
9. **iPad is primary target** — min touch targets 44px, test at 768px+ widths

## Commands
```
npx next build          # Type check + production build
npx next dev --turbopack --port 3002  # Dev with hot reload
```

## Patterns
- `pendingDrop` + `_seq` counter pattern for forwarding DnD drops to child components
- `safeTimeout` + `orderGenRef` generation counter to prevent stale timeout bugs
- `sessionStorage` for lesson state persistence (skip restoring "celebration" phase)
- `masteryLevel` increments every 3 smash+merge actions, unlocks extra fractions
