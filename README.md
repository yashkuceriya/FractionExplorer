# FractionLab

**AI-powered fraction tutor for ages 5-8. Kids split, merge, and compare fraction blocks to discover equivalence — guided by a voice tutor that adapts to every move.**

No API keys needed. Works fully out of the box.

## Quick start

```bash
git clone https://github.com/yashkuceriya/FractionExplorer.git
cd synthesis-tutor
npm install
npm run dev
```

Open http://localhost:3002 (iPad Safari recommended).

Optional `.env.local` for enhanced features:

```
ANTHROPIC_API_KEY=...           # AI tutor (scripted fallback works without)
NEXT_PUBLIC_SUPABASE_URL=...    # Parent accounts + cloud sync
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ELEVENLABS_API_KEY=...          # HD character voices
```

## Tech stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| AI tutor | Anthropic Claude via Vercel AI SDK + deterministic scripted fallback |
| Manipulatives | Custom SVG fraction blocks, @dnd-kit drag-and-drop |
| Voice | Web Speech API + optional ElevenLabs |
| Auth | Supabase (optional), parent/student PIN handoff |
| Progress | XP, levels, badges, streaks, MTSS mastery tracking |

## Architecture

```
User opens app
  │
  ├─ Guest mode (no setup) ──────────────┐
  │                                       │
  └─ Parent signup → add students → PIN ──┘
                                          │
                                    Episode Select
                                          │
                            ┌─────────────┴──────────────┐
                      Episode Mode                  Free Play
                      (guided curriculum)           (open workspace)
                            │                            │
                   Warmup → Missions →            Drag/split/merge
                   Boss → Exit Ticket             Compare fractions
                            │                            │
                            └─────────────┬──────────────┘
                                          │
                                    AI/Scripted Tutor
                                    (adapts to actions)
                                          │
                                    Voice Narrator
                                    (TTS playback)
```

**Lesson flow per episode:**
Warmup (1 easy task) → Missions (3-4 guided challenges) → Boss (harder challenge) → Exit Ticket (assessment) → Completion + badges

**Tutor pipeline:**
Student action → context builder → Claude API (or scripted fallback) → streaming response → TTS voice playback

## Project structure

```
app/
  page.tsx              Welcome screen
  lesson/page.tsx       Main lesson (tutor + workspace + episodes)
  api/tutor/route.ts    Tutor API with scripted fallback
  api/tts/route.ts      ElevenLabs TTS proxy
  signup/page.tsx       Parent registration
  login/page.tsx        Parent login
  pick-student/         Student selector with PIN
  parent/dashboard/     Parent progress dashboard

components/
  manipulative/         Fraction blocks, workspace, episode player
  chat/                 Chat panel, tutor avatar, message bubbles
  feedback/             Celebrations, badges, XP bar, trophy wall
  voice/                TTS narrator, character picker

lib/
  ai/                   System prompt, scripted tutor, lesson context
  curriculum.ts         18 episodes with missions
  fractions.ts          Fraction math + color mapping
  progress.ts           XP, levels, streaks, daily goals
  mastery.ts            Per-skill MTSS tracking
  badges.ts             8 achievement badges
```

## Demo path (90 seconds)

1. Landing → tap "Start First Lesson"
2. Episode 1 highlighted → tap it
3. Split a cookie bar into 2 pieces
4. Color your half
5. Cut pizza into 4 slices, color 1
6. Boss: split a cake into 6
7. Switch to Explore → drag blocks into comparison boxes
8. Discover 1/2 = 2/4 → celebration fires
9. Smash 2/4 into 1/4 + 1/4

**Best moments:** tutor reacting to answers, equivalence discovery celebration, split/merge mechanics, completion badges.

## Guest mode (zero config)

Everything works without API keys or accounts:
18 episodes, scripted tutor, voice narration, XP/badges/streaks, all manipulatives, free-play exploration, celebrations.
