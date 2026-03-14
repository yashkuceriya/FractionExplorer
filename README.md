# FractionLab

**An AI-powered fraction tutor for kids ages 5-8 that teaches equivalence through hands-on digital manipulatives.**

Kids split, merge, and compare colorful fraction blocks while a voice-guided tutor adapts to their every move — discovering on their own that 1/2 and 2/4 are secretly the same.

## What makes it special

- **Hands-on discovery, not drilling** — Kids drag, split, and merge fraction blocks to discover equivalence visually, the way research says works best
- **AI tutor with personality** — A kids' show host character that gets genuinely excited about fractions, adapts hints to struggles, and never makes a wrong answer feel bad
- **Works without any API keys** — A full scripted tutor fallback means the complete experience runs with zero configuration. Add Anthropic/OpenAI keys for AI-powered responses, ElevenLabs for HD voices, Supabase for parent accounts — all optional
- **18 guided episodes** — Structured curriculum from "what's a whole?" to adding fractions, with warmups, missions, boss challenges, and exit tickets
- **iPad-first, touch-optimized** — 44px tap targets, portrait + landscape layouts, safe area support

## Quick start

```bash
git clone https://github.com/yashkuceriya/FractionExplorer.git
cd synthesis-tutor
npm install
npm run dev
```

Open http://localhost:3002 — works on any browser, best on iPad Safari.

**No API keys needed.** The app runs fully with guest mode and scripted tutor. To enable optional services, create `.env.local`:

```
# AI-powered tutor (optional — scripted fallback works great)
ANTHROPIC_API_KEY=your_key

# Parent accounts & cloud sync (optional — local storage works)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# HD character voices (optional — Web Speech API works)
ELEVENLABS_API_KEY=your_key
```

## What works in guest mode (no setup)

- Full 18-episode curriculum with warmups, missions, bosses, exit tickets
- Scripted tutor with warm, context-aware responses
- Voice narration (Web Speech API)
- XP, levels, badges, streak tracking (localStorage)
- All fraction manipulatives: drag, split, merge, compare
- Free-play exploration mode with fraction workspace
- Celebration animations, Swiper challenges, trophy wall

## Demo path (90 seconds)

1. **Landing page** — Tap "Start First Lesson"
2. **Episode select** — The recommended episode card is highlighted, tap it
3. **Episode 1: Fair Shares** — Tutor introduces sharing, first mission appears
4. **Split a cookie bar** into 2 equal pieces (partition tool)
5. **Color your half** — Shade 1 of 2 pieces
6. **Cut pizza into 4 slices**, color 1 slice
7. **Boss challenge** — Split a cake into 6 pieces
8. **Switch to "Explore" tab** — Drag fraction blocks into comparison boxes
9. **Discover 1/2 = 2/4** — Full celebration animation fires
10. **Smash 2/4** into 1/4 + 1/4 — See equivalence visually

**Key moments to highlight:** The tutor reacting to correct/wrong answers, the equivalence celebration, split/merge mechanics, the completion screen with badges.

## Technical stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| AI Tutor | Anthropic Claude via Vercel AI SDK (streaming) + scripted fallback |
| Manipulatives | Custom SVG fraction blocks with @dnd-kit drag-and-drop |
| Voice | Web Speech API + optional ElevenLabs HD voices |
| Auth | Supabase (optional) with parent/student PIN system |
| Curriculum | 18 episodes, Common Core aligned (grades 2-4) |
| Progress | XP/level/badge/streak system, MTSS mastery tracking |

## Project structure

```
app/
  page.tsx              — Welcome screen with two entry paths
  lesson/page.tsx       — Main lesson page (tutor + workspace)
  api/tutor/route.ts    — AI tutor API with scripted fallback
  signup/page.tsx       — Parent registration
components/
  manipulative/         — Fraction blocks, workspace, episode player
  chat/                 — Chat panel, message bubbles, tutor avatar
  feedback/             — Celebrations, badges, XP bar, missions
  voice/                — Text-to-speech narrator, character picker
lib/
  ai/                   — System prompt, scripted tutor, lesson context
  curriculum.ts         — 18 episode definitions with missions
  fractions.ts          — Fraction math + color utilities
  progress.ts           — XP, levels, streaks, daily goals
  mastery.ts            — Per-skill MTSS mastery tracking
  badges.ts             — 8 achievement badges with unlock logic
```
