"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FractionCircle from "./FractionCircle";
import PartitionTool from "./PartitionTool";
import NumberLineInteractive from "./NumberLineInteractive";
import FractionBar from "./FractionBar";

export type MissionType =
  | "partition-shape"
  | "shade-fraction"
  | "place-numberline"
  | "find-equivalent"
  | "compare"
  | "build-from-units"
  | "complement"
  | "add-fractions"
  | "identify"
  | "benchmark-sort";

export type ManipulativeType = "bar" | "circle" | "numberline" | "partition";

export interface EpisodeMission {
  type: MissionType;
  manipulative: ManipulativeType;
  prompt: string;
  fraction: { n: number; d: number };
  answer?: { n: number; d: number };
  choices?: { n: number; d: number }[];
  xpReward: number;
  hints: string[];
}

export interface EpisodeData {
  id: number;
  title: string;
  emoji: string;
  warmup: EpisodeMission;
  missions: EpisodeMission[];
  boss: EpisodeMission;
  exitTicket: EpisodeMission;
}

type EpisodePhase = "warmup" | "mission" | "boss" | "exit-ticket" | "complete";

interface EpisodePlayerProps {
  episode: EpisodeData;
  onMissionComplete: (mission: EpisodeMission, correct: boolean, hintUsed: boolean) => void;
  onEpisodeComplete: (xpEarned: number) => void;
  onTutorEvent: (event: string) => void;
}

export default function EpisodePlayer({
  episode,
  onMissionComplete,
  onEpisodeComplete,
  onTutorEvent,
}: EpisodePlayerProps) {
  const [phase, setPhase] = useState<EpisodePhase>("warmup");
  const [missionIndex, setMissionIndex] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [hintIndex, setHintIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);

  // Interaction state
  const [shadedSegments, setShadedSegments] = useState<boolean[]>([]);
  const [placedFraction, setPlacedFraction] = useState<{ n: number; d: number } | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  // For partition-shape: kid must choose how many pieces to split into
  const [chosenDenominator, setChosenDenominator] = useState(1);

  const currentMission = (() => {
    switch (phase) {
      case "warmup": return episode.warmup;
      case "mission": return episode.missions[missionIndex];
      case "boss": return episode.boss;
      case "exit-ticket": return episode.exitTicket;
      default: return null;
    }
  })();

  const totalMissions = 1 + episode.missions.length + 1 + 1; // warmup + missions + boss + exit
  const completedCount = (() => {
    switch (phase) {
      case "warmup": return 0;
      case "mission": return 1 + missionIndex;
      case "boss": return 1 + episode.missions.length;
      case "exit-ticket": return 2 + episode.missions.length;
      case "complete": return totalMissions;
    }
  })();

  const resetInteraction = useCallback((mission: EpisodeMission) => {
    if (mission.type === "partition-shape") {
      // Start with 1 piece (whole) — kid must choose how to split
      setChosenDenominator(1);
      setShadedSegments([false]);
    } else {
      setShadedSegments(new Array(mission.fraction.d).fill(false));
    }
    setPlacedFraction(null);
    setSelectedChoice(null);
    setHintIndex(0);
    setAttempts(0);
    setShowHint(false);
    setShowCorrect(false);
  }, []);

  const advanceToNext = useCallback(() => {
    switch (phase) {
      case "warmup":
        setPhase("mission");
        setMissionIndex(0);
        if (episode.missions[0]) resetInteraction(episode.missions[0]);
        break;
      case "mission":
        if (missionIndex < episode.missions.length - 1) {
          const next = missionIndex + 1;
          setMissionIndex(next);
          resetInteraction(episode.missions[next]);
        } else {
          setPhase("boss");
          resetInteraction(episode.boss);
        }
        break;
      case "boss":
        setPhase("exit-ticket");
        resetInteraction(episode.exitTicket);
        break;
      case "exit-ticket":
        setPhase("complete");
        onEpisodeComplete(totalXP);
        break;
    }
  }, [phase, missionIndex, episode, resetInteraction, onEpisodeComplete, totalXP]);

  const checkAnswer = useCallback(() => {
    if (!currentMission) return;

    let correct = false;
    const hintUsed = hintIndex > 0;

    switch (currentMission.type) {
      case "partition-shape": {
        // Kid must split into the right number of pieces
        correct = chosenDenominator === currentMission.fraction.d;
        break;
      }
      case "shade-fraction": {
        const shadedCount = shadedSegments.filter(Boolean).length;
        correct = shadedCount === currentMission.fraction.n;
        break;
      }
      case "place-numberline": {
        if (placedFraction) {
          correct =
            placedFraction.n * currentMission.fraction.d ===
            currentMission.fraction.n * placedFraction.d;
        }
        break;
      }
      case "identify":
      case "compare":
      case "find-equivalent":
      case "benchmark-sort": {
        if (selectedChoice !== null && currentMission.answer) {
          const choice = currentMission.choices?.[selectedChoice];
          if (choice) {
            correct =
              choice.n * currentMission.answer.d ===
              currentMission.answer.n * choice.d;
          }
        }
        break;
      }
      case "build-from-units": {
        const shadedCount = shadedSegments.filter(Boolean).length;
        correct = shadedCount === currentMission.fraction.n;
        break;
      }
      case "complement": {
        if (placedFraction && currentMission.answer) {
          correct =
            placedFraction.n * currentMission.answer.d ===
            currentMission.answer.n * placedFraction.d;
        }
        break;
      }
      case "add-fractions": {
        if (selectedChoice !== null && currentMission.answer) {
          const choice = currentMission.choices?.[selectedChoice];
          if (choice) {
            correct =
              choice.n * currentMission.answer.d ===
              currentMission.answer.n * choice.d;
          }
        }
        break;
      }
    }

    setAttempts((a) => a + 1);

    if (correct) {
      setShowCorrect(true);
      const xp = currentMission.xpReward;
      setTotalXP((t) => t + xp);
      onMissionComplete(currentMission, true, hintUsed);
      onTutorEvent(`[Student completed ${phase} mission correctly! ${hintUsed ? "Used hints." : "No hints needed!"} +${xp} XP. Celebrate with "WE DID IT!" energy!]`);
      setTimeout(() => advanceToNext(), 1500);
    } else {
      const newAttempts = attempts + 1;
      if (newAttempts >= (currentMission.hints.length > 0 ? 2 : 3)) {
        setShowHint(true);
      }
      onMissionComplete(currentMission, false, false);
      onTutorEvent(`[Student got it wrong on ${phase} mission (attempt ${newAttempts}). ${showHint && currentMission.hints[hintIndex] ? `Give hint: "${currentMission.hints[hintIndex]}"` : "Encourage them warmly!"}]`);
    }
  }, [currentMission, shadedSegments, placedFraction, selectedChoice, chosenDenominator, phase, hintIndex, attempts, showHint, onMissionComplete, onTutorEvent, advanceToNext]);

  const handleHint = useCallback(() => {
    if (!currentMission) return;
    if (hintIndex < currentMission.hints.length - 1) {
      setHintIndex((h) => h + 1);
    }
    setShowHint(true);
    onTutorEvent(`[Student asked for hint. Tell them: "${currentMission.hints[Math.min(hintIndex, currentMission.hints.length - 1)]}"]`);
  }, [currentMission, hintIndex, onTutorEvent]);

  // Initialize when currentMission changes
  useEffect(() => {
    if (currentMission) {
      resetInteraction(currentMission);
    }
  }, [currentMission, resetInteraction]);

  if (phase === "complete") {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center gap-4 p-6"
      >
        <motion.span
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-6xl"
        >
          {episode.emoji}
        </motion.span>
        <h2 className="text-2xl font-black text-purple-800">WE DID IT!</h2>
        <p className="text-sm font-bold text-pink-600">{episode.title} Complete!</p>
        <div className="bg-pink-100 rounded-xl px-4 py-2">
          <span className="text-lg font-black text-purple-700">+{totalXP} XP</span>
        </div>
      </motion.div>
    );
  }

  if (!currentMission) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-black text-purple-600 capitalize">{phase === "exit-ticket" ? "Exit Ticket" : phase}</span>
          <span className="text-xs text-purple-400">{completedCount + 1}/{totalMissions}</span>
        </div>
        <div className="h-2 bg-pink-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full"
            animate={{ width: `${(completedCount / totalMissions) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Mission prompt */}
      <div className="px-3 pb-2">
        <div className="bg-white rounded-xl border-2 border-pink-200 px-4 py-2.5 shadow-sm">
          <p className="text-sm font-black text-purple-800 leading-snug">
            {phase === "boss" && "🏆 "}{currentMission.prompt}
          </p>
        </div>
      </div>

      {/* Manipulative area */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 pb-2 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${phase}-${missionIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full flex justify-center"
          >
            {renderManipulative(currentMission, {
              shadedSegments,
              setShadedSegments,
              placedFraction,
              setPlacedFraction,
              selectedChoice,
              setSelectedChoice,
              chosenDenominator,
              setChosenDenominator: (d: number) => {
                setChosenDenominator(d);
                setShadedSegments(new Array(d).fill(false));
              },
            })}
          </motion.div>
        </AnimatePresence>

        {/* Tap instruction for shade/build missions */}
        {(currentMission.type === "shade-fraction" || currentMission.type === "build-from-units") && !showCorrect && (
          <p className="text-xs font-bold text-pink-400 mt-1 animate-pulse">
            👆 {shadedSegments.filter(Boolean).length === 0
              ? "Tap the pieces to color them!"
              : `${shadedSegments.filter(Boolean).length} out of ${currentMission.fraction.d} colored. Tap one to color it.`}
          </p>
        )}
      </div>

      {/* Hint area */}
      <AnimatePresence>
        {showHint && currentMission.hints[Math.min(hintIndex, currentMission.hints.length - 1)] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pb-2"
          >
            <div className="bg-purple-50 rounded-xl border border-purple-200 px-3 py-2">
              <p className="text-xs font-bold text-purple-700">
                💡 {currentMission.hints[Math.min(hintIndex, currentMission.hints.length - 1)]}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Correct feedback */}
      <AnimatePresence>
        {showCorrect && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
          >
            <div className="bg-green-500 text-white text-2xl font-black rounded-2xl px-8 py-4 shadow-2xl">
              WE DID IT! 🎉
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="px-3 pb-3 flex gap-2">
        <button
          onClick={handleHint}
          className="px-4 py-3 bg-purple-100 text-purple-700 font-bold rounded-xl text-sm flex-shrink-0 active:scale-95 transition-transform"
        >
          💡 Hint
        </button>
        <button
          onClick={checkAnswer}
          className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-black rounded-xl text-sm shadow-lg active:scale-95 transition-transform"
        >
          Check My Answer!
        </button>
      </div>
    </div>
  );
}

/** Render the right manipulative based on mission type */
function renderManipulative(
  mission: EpisodeMission,
  state: {
    shadedSegments: boolean[];
    setShadedSegments: (s: boolean[]) => void;
    placedFraction: { n: number; d: number } | null;
    setPlacedFraction: (f: { n: number; d: number } | null) => void;
    selectedChoice: number | null;
    setSelectedChoice: (i: number | null) => void;
    chosenDenominator: number;
    setChosenDenominator: (d: number) => void;
  }
) {
  const { shadedSegments, setShadedSegments, setPlacedFraction, selectedChoice, setSelectedChoice, chosenDenominator, setChosenDenominator } = state;

  // For partition-shape missions, show PartitionTool with controls so kid chooses how to split
  if (mission.type === "partition-shape") {
    return (
      <PartitionTool
        shape={mission.manipulative === "circle" ? "circle" : "rectangle"}
        denominator={chosenDenominator}
        shadedSegments={shadedSegments}
        onToggleSegment={(i) => {
          const next = [...shadedSegments];
          next[i] = !next[i];
          setShadedSegments(next);
        }}
        onChangeDenominator={setChosenDenominator}
        size={220}
        showControls={true}
      />
    );
  }

  // shade-fraction and build-from-units need tappable segments regardless of manipulative type
  if (mission.type === "shade-fraction" || mission.type === "build-from-units") {
    const shape = mission.manipulative === "circle" ? "circle" : "rectangle";
    if (shape === "circle") {
      return (
        <FractionCircle
          denominator={mission.fraction.d}
          shadedSegments={shadedSegments}
          onToggleSegment={(i) => {
            const next = [...shadedSegments];
            next[i] = !next[i];
            setShadedSegments(next);
          }}
          size={200}
          showLabel
        />
      );
    }
    return (
      <PartitionTool
        shape="rectangle"
        denominator={mission.fraction.d}
        shadedSegments={shadedSegments}
        onToggleSegment={(i) => {
          const next = [...shadedSegments];
          next[i] = !next[i];
          setShadedSegments(next);
        }}
        size={260}
        showControls={false}
      />
    );
  }

  switch (mission.manipulative) {
    case "circle":
      return (
        <FractionCircle
          denominator={mission.fraction.d}
          shadedSegments={shadedSegments}
          onToggleSegment={(i) => {
            const next = [...shadedSegments];
            next[i] = !next[i];
            setShadedSegments(next);
          }}
          size={200}
          showLabel
        />
      );

    case "partition":
      return (
        <PartitionTool
          shape="rectangle"
          denominator={mission.fraction.d}
          shadedSegments={shadedSegments}
          onToggleSegment={(i) => {
            const next = [...shadedSegments];
            next[i] = !next[i];
            setShadedSegments(next);
          }}
          size={220}
          showControls={false}
        />
      );

    case "numberline":
      return (
        <NumberLineInteractive
          denominator={mission.fraction.d}
          onPlace={(f) => setPlacedFraction({ n: f.numerator, d: f.denominator })}
          targetFraction={mission.type === "place-numberline" ? { numerator: mission.fraction.n, denominator: mission.fraction.d } : undefined}
          showBenchmarks
        />
      );

    case "bar":
    default:
      if (mission.choices && mission.choices.length > 0) {
        // Multiple choice with fraction bars
        return (
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            {mission.choices.map((choice, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedChoice(i)}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  selectedChoice === i
                    ? "border-pink-500 bg-pink-50 shadow-md"
                    : "border-gray-200 bg-white"
                }`}
              >
                <FractionBar
                  numerator={choice.n}
                  denominator={choice.d}
                  color="#F13EA1"
                  width={100}
                  height={24}
                />
                <span className="text-sm font-black text-purple-800">
                  {choice.n}/{choice.d}
                </span>
              </motion.button>
            ))}
          </div>
        );
      }

      // Default: single fraction bar display (for identify, compare, etc.)
      return (
        <div className="flex flex-col items-center gap-3">
          <FractionBar
            numerator={mission.fraction.n}
            denominator={mission.fraction.d}
            color="#F13EA1"
            width={200}
            height={40}
          />
          <span className="text-lg font-black text-purple-800">
            {mission.fraction.n}/{mission.fraction.d}
          </span>
        </div>
      );
  }
}
