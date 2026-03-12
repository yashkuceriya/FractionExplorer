"use client";

import { useState, useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import FractionBar from "./FractionBar";
import { playSuccess, playDefeat, playVictoryFanfare } from "@/lib/sounds";

export interface FractionDrop {
  numerator: number;
  denominator: number;
  color: string;
  _seq: number;
}

interface FractionBattleProps {
  onScore?: (playerWon: boolean) => void;
  pendingDrop?: FractionDrop | null;
  playerLevel?: number;
  onXP?: (amount: number, label: string) => void;
  onGameEvent?: (event: string) => void;
}

type Fraction = { n: number; d: number };

const BOT_POOL: Fraction[] = [
  { n: 1, d: 2 }, { n: 1, d: 3 }, { n: 2, d: 3 },
  { n: 1, d: 4 }, { n: 3, d: 4 }, { n: 1, d: 5 },
  { n: 1, d: 6 }, { n: 1, d: 8 }, { n: 2, d: 4 },
  { n: 2, d: 6 }, { n: 3, d: 6 },
];

type RoundResult = "player" | "bot" | "tie" | null;

function compareFractions(a: Fraction, b: Fraction): RoundResult {
  const left = a.n * b.d;
  const right = b.n * a.d;
  if (left > right) return "player";
  if (left < right) return "bot";
  return "tie";
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function roundsForLevel(level: number): number {
  if (level <= 1) return 3;
  if (level <= 3) return 5;
  return 7;
}

export default function FractionBattle({ onScore, pendingDrop, playerLevel = 0, onXP, onGameEvent }: FractionBattleProps) {
  const [playerFrac, setPlayerFrac] = useState<Fraction | null>(null);
  const [botFrac, setBotFrac] = useState<Fraction | null>(null);
  const [result, setResult] = useState<RoundResult>(null);
  const [busy, setBusy] = useState(false);
  const [pScore, setPScore] = useState(0);
  const [bScore, setBScore] = useState(0);
  const [round, setRound] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const { setNodeRef, isOver } = useDroppable({ id: "battle-player" });
  const totalRounds = roundsForLevel(playerLevel);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Track scores in refs so nested timeouts get current values
  const pScoreRef = useRef(0);
  const bScoreRef = useRef(0);

  function handleDrop(frac: Fraction) {
    if (busy || gameOver) return;
    setBusy(true);

    const bot = pickRandom(BOT_POOL);
    setPlayerFrac(frac);

    // Show bot after short beat
    timerRef.current = setTimeout(() => {
      setBotFrac(bot);

      // Compare after brief suspense
      timerRef.current = setTimeout(() => {
        const r = compareFractions(frac, bot);
        setResult(r);

        if (r === "player") {
          const newPS = pScoreRef.current + 1;
          pScoreRef.current = newPS;
          setPScore(newPS);
          playSuccess();
          onScore?.(true);
          onXP?.(3, "Battle round won!");
          onGameEvent?.(`[Battle round result: Student's ${frac.n}/${frac.d} BEAT bot's ${bot.n}/${bot.d}! Score: Student ${newPS} - Bot ${bScoreRef.current}. Celebrate! "${frac.n}/${frac.d} is BIGGER than ${bot.n}/${bot.d}! Nice pick!"]`);
        } else if (r === "bot") {
          const newBS = bScoreRef.current + 1;
          bScoreRef.current = newBS;
          setBScore(newBS);
          playDefeat();
          onScore?.(false);
          onGameEvent?.(`[Battle round result: Bot's ${bot.n}/${bot.d} beat student's ${frac.n}/${frac.d}. Score: Student ${pScoreRef.current} - Bot ${newBS}. Be encouraging! "${bot.n}/${bot.d} was bigger this time — but you'll get the next one!"]`);
        } else {
          onGameEvent?.(`[Battle round result: TIE! Both ${frac.n}/${frac.d} and ${bot.n}/${bot.d} are equal! Cool discovery!]`);
        }

        // Next round or game over
        timerRef.current = setTimeout(() => {
          const nextRound = round + 1;
          setRound(nextRound);

          if (nextRound >= totalRounds) {
            setGameOver(true);
            playVictoryFanfare();
            const finalP = pScoreRef.current;
            const finalB = bScoreRef.current;
            if (finalP > finalB) {
              onXP?.(5, "Battle victory!");
              onGameEvent?.(`[BATTLE OVER! Student WON ${finalP}-${finalB}! Go absolutely wild celebrating! "WE WON! WE WON! YOU BEAT THE BOT!" Give them tons of energy!]`);
            } else if (finalB > finalP) {
              onGameEvent?.(`[BATTLE OVER! Bot won ${finalB}-${finalP}. Be warm and encouraging! "That was SO close! The bot got lucky — want to try again? I KNOW you can beat it!"]`);
            } else {
              onXP?.(2, "Battle draw!");
              onGameEvent?.(`[BATTLE OVER! It's a DRAW ${finalP}-${finalB}! "A tie! That means you're JUST as smart as the bot! Rematch?"]`);
            }
          } else {
            setPlayerFrac(null);
            setBotFrac(null);
            setResult(null);
            setBusy(false);
          }
        }, 1200);
      }, 600);
    }, 300);
  }

  function resetGame() {
    clearTimeout(timerRef.current);
    setPlayerFrac(null);
    setBotFrac(null);
    setResult(null);
    setBusy(false);
    setPScore(0);
    setBScore(0);
    pScoreRef.current = 0;
    bScoreRef.current = 0;
    setRound(0);
    setGameOver(false);
    onGameEvent?.(`[Student started a NEW battle! Cheer them on! "Round 1 — FIGHT! Pick your biggest fraction!"]`);
  }

  // React to drops from workspace
  const lastSeq = useRef(-1);
  useEffect(() => {
    if (pendingDrop && pendingDrop._seq !== lastSeq.current) {
      lastSeq.current = pendingDrop._seq;
      handleDrop({ n: pendingDrop.numerator, d: pendingDrop.denominator });
    }
  }, [pendingDrop]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const finalWinner = pScore > bScore ? "player" : bScore > pScore ? "bot" : "draw";

  return (
    <div className="relative flex flex-col items-center gap-3 w-full max-w-lg mx-auto">
      {/* Scoreboard */}
      <div className="flex items-center justify-between w-full bg-gradient-to-r from-amber-50 via-orange-50/50 to-red-50 rounded-xl px-4 py-2 border-2 border-amber-200/60">
        <div className="text-center">
          <p className="text-[10px] font-black text-amber-600">YOU</p>
          <p className="text-2xl font-black text-amber-800">{pScore}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold text-gray-400">Round {Math.min(round + 1, totalRounds)}/{totalRounds}</p>
          <p className="text-xl">⚔️</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-red-500">BOT</p>
          <p className="text-2xl font-black text-red-600">{bScore}</p>
        </div>
      </div>

      {/* Battle Arena */}
      <div className="flex items-center gap-3 w-full">
        {/* Player side */}
        <div
          ref={setNodeRef}
          className={`flex-1 flex flex-col items-center justify-center rounded-2xl p-4 min-h-[120px] border-2 border-dashed transition-colors ${
            isOver
              ? "bg-emerald-100/60 border-emerald-400"
              : playerFrac
              ? "bg-amber-50 border-amber-200"
              : "bg-amber-50/30 border-amber-200/50"
          }`}
        >
          {playerFrac ? (
            <div className="flex flex-col items-center gap-1">
              <FractionBar
                numerator={playerFrac.n}
                denominator={playerFrac.d}
                color="#f97316"
                width={120}
                height={34}
              />
              {result === "player" && <span className="text-2xl mt-1">👑</span>}
              {result === "bot" && <span className="text-xs font-bold text-amber-400 mt-1">Next time!</span>}
              {result === "tie" && <span className="text-lg mt-1">🤝</span>}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-2xl mb-1">👆</p>
              <p className="text-xs font-black text-amber-500">Drag here!</p>
            </div>
          )}
        </div>

        {/* VS */}
        <div className="text-lg font-black text-orange-300 shrink-0">VS</div>

        {/* Bot side */}
        <div className="flex-1 flex flex-col items-center justify-center rounded-2xl p-4 min-h-[120px] bg-red-50/30 border-2 border-dashed border-red-200/50">
          {botFrac ? (
            <div className="flex flex-col items-center gap-1">
              <FractionBar
                numerator={botFrac.n}
                denominator={botFrac.d}
                color="#ef4444"
                width={120}
                height={34}
              />
              {result === "bot" && <span className="text-2xl mt-1">👑</span>}
              {result === "player" && <span className="text-xs font-bold text-red-300 mt-1">Bzzzt!</span>}
              {result === "tie" && <span className="text-lg mt-1">🤝</span>}
            </div>
          ) : busy ? (
            <div className="text-center">
              <p className="text-2xl animate-spin">🤖</p>
              <p className="text-xs font-black text-red-400 mt-1">Picking...</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-2xl">🤖</p>
              <p className="text-xs font-black text-red-300">Frax Bot</p>
            </div>
          )}
        </div>
      </div>

      {/* Hint */}
      {!busy && !gameOver && (
        <p className="text-[10px] text-amber-600 font-black text-center">
          Pick the BIGGEST fraction! Drag it to your side!
        </p>
      )}

      {/* Game Over */}
      {gameOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 rounded-2xl border-2 border-amber-200">
          <p className="text-4xl mb-2">
            {finalWinner === "player" ? "🏆" : finalWinner === "bot" ? "🤖" : "🤝"}
          </p>
          <h2 className="text-xl font-black text-amber-800 mb-1">
            {finalWinner === "player"
              ? "YOU WIN!"
              : finalWinner === "bot"
              ? "So close! Try again!"
              : "It's a draw!"}
          </h2>
          <p className="text-sm text-gray-500 mb-4">{pScore} — {bScore}</p>
          <button
            onClick={resetGame}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-transform tracking-wide"
          >
            Rematch!
          </button>
        </div>
      )}
    </div>
  );
}
