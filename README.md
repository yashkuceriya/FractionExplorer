## FractionLab

A conversational math tutor that teaches fraction equivalence through interactive digital manipulatives.

### What it is

- Web app where an AI tutor guides students through fraction equivalence (1/2 = 2/4, etc.)
- Interactive fraction workspace: drag, split, merge, and compare fraction blocks
- Conversational AI tutor that adapts to student actions (with scripted fallback when no API key)
- Built for iPad Safari

### How to run

```bash
git clone <repo>
cd synthesis-tutor
npm install
npm run dev
```

Open http://localhost:3002 in a browser (iPad Safari recommended).

### Environment variables

Create `.env.local`:

```
# Optional — enables AI-powered tutor (falls back to scripted tutor without these)
ANTHROPIC_API_KEY=your_key_here
# Or use OpenAI instead:
# OPENAI_API_KEY=your_key_here

# Optional — enables parent accounts and progress sync
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# Optional — higher quality character voices
ELEVENLABS_API_KEY=your_key

# Optional — LLM cost tracking and observability
LANGSMITH_API_KEY=your_key
LANGSMITH_PROJECT=synthesis-tutor
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
```

### Technical approach

- **Framework**: Next.js 16 (App Router) with React 19, TypeScript, Tailwind CSS 4
- **Tutor**: Anthropic Claude via Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) with streaming responses. Falls back to a deterministic scripted tutor when no API key is configured — the app is fully functional either way.
- **Manipulative**: Custom SVG-based fraction blocks with drag-and-drop (@dnd-kit), split/merge/compare operations. Visual equivalence discovery through a "comparison zone" where students test if two fractions are equal.
- **Lesson flow**: Guided episodes (warmup -> missions -> boss -> exit ticket) teach fraction concepts progressively. Free-play workspace available for open exploration.
- **Voice**: Web Speech API text-to-speech with character voices. Optional ElevenLabs integration for higher quality.
- **iPad support**: Touch-optimized with 44px minimum tap targets, responsive portrait/landscape layouts, pinch-zoom enabled.
- **Observability**: Optional LangSmith tracing for LLM cost tracking and prompt debugging.

### Demo path (1-2 minutes)

1. Open app, tap "Let's Go!"
2. Select Episode 1 "Fair Shares"
3. Split a cookie bar in half (partition tool)
4. Color your piece (shade 1 of 2)
5. Cut a pizza into 4 slices
6. Color your slice (shade 1 of 4)
7. Boss: split a cake into 6 pieces
8. Switch to "Explore" tab, drag fraction blocks into comparison boxes
9. Discover that 1/2 = 2/4 (celebration animation)
10. Split 1/2 into 2/4 using the smash tool

### Project structure

```
app/
  lesson/page.tsx     — Main lesson page (tutor + workspace)
  api/tutor/route.ts  — Tutor API (AI + scripted fallback)
  page.tsx            — Welcome screen
components/
  manipulative/       — Fraction blocks, workspace, comparison zone
  chat/               — Chat panel, message bubbles, input
  voice/              — Text-to-speech narrator
lib/
  ai/                 — System prompt, scripted tutor fallback
  curriculum.ts       — Episode/mission definitions
  fractions.ts        — Fraction math utilities
  progress.ts         — XP and progression system
```
