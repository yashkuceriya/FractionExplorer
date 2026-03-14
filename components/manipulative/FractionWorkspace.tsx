"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  type CollisionDetection,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  DragOverlay,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import FractionPiece from "./FractionPiece";
import ComparisonZone from "./ComparisonZone";
import FractionBar from "./FractionBar";
import NumberLine from "./NumberLine";
import FractionBattle, { type FractionDrop } from "./FractionBattle";
import TowerChallenge from "./TowerChallenge";
import RecipeChallenge from "./RecipeChallenge";
import PizzaChallenge from "./PizzaChallenge";
import FractionRain from "./FractionRain";
import FractionBuilder from "./FractionBuilder";
import Backpack from "./Backpack";
import {
  AVAILABLE_FRACTIONS,
  EXTENDED_FRACTIONS,
  getFractionColor,
  areFractionsEqual,
  getRandomFraction,
  lcm,
  type FractionData,
} from "@/lib/fractions";
import { playDrop, playSuccess, playSmash, playMerge, playError, playReset, playPickup } from "@/lib/sounds";
import { MODE_UNLOCK_LEVELS } from "@/lib/progress";

/** Check if two fractions can merge. Returns the result fraction or null. */
function canMergeFractions(
  aN: number, aD: number,
  bN: number, bD: number
): { numerator: number; denominator: number } | null {
  const commonD = lcm(aD, bD);
  // Don't allow absurdly large denominators (keep it kid-friendly)
  if (commonD > 24) return null;
  const combinedN = aN * (commonD / aD) + bN * (commonD / bD);
  if (combinedN > commonD) return null;
  return { numerator: combinedN, denominator: commonD };
}

/** Build the equation label string for a merge. */
function buildMergeLabel(
  sN: number, sD: number,
  tN: number, tD: number,
  rN: number, rD: number
): string {
  if (sD === tD) {
    // Same denominator: "1/4 + 1/4 = 2/4"
    return `${sN}/${sD} + ${tN}/${tD} = ${rN}/${rD}`;
  }
  // Cross-denominator: "1/2 + 1/4 = 2/4 + 1/4 = 3/4"
  const convertedSN = sN * (rD / sD);
  const convertedTN = tN * (rD / tD);
  return `${sN}/${sD} + ${tN}/${tD} = ${convertedSN}/${rD} + ${convertedTN}/${rD} = ${rN}/${rD}`;
}

type ChallengeMode = "compare" | "battle" | "tower" | "recipe" | "pizza" | "rain";

// Extra fractions: first 3 always in pool; rest unlock with mastery (1 per 2 points)
const EXTRA_FRACTIONS: FractionData[] = [
  { numerator: 2, denominator: 4, color: getFractionColor(2, 4) },
  { numerator: 2, denominator: 6, color: getFractionColor(2, 6) },
  { numerator: 3, denominator: 6, color: getFractionColor(3, 6) },
  { numerator: 2, denominator: 8, color: getFractionColor(2, 8) },
  { numerator: 4, denominator: 8, color: getFractionColor(4, 8) },
  { numerator: 2, denominator: 3, color: getFractionColor(2, 3) },
  { numerator: 3, denominator: 4, color: getFractionColor(3, 4) },
  ...EXTENDED_FRACTIONS,
];
const LOCKED_FRACTIONS: FractionData[] = EXTRA_FRACTIONS.slice(3);
const BASE_EXTRA_FRACTIONS: FractionData[] = EXTRA_FRACTIONS.slice(0, 3);

const CHALLENGE_TABS: { mode: ChallengeMode; label: string; emoji: string }[] = [
  { mode: "compare", label: "Twins?", emoji: "⚖️" },
  { mode: "battle", label: "Battle!", emoji: "⚔️" },
  { mode: "tower", label: "Tower", emoji: "🏗️" },
  { mode: "recipe", label: "Cook!", emoji: "🍳" },
  { mode: "pizza", label: "Pizza!", emoji: "🍕" },
  { mode: "rain", label: "Rain!", emoji: "🌧️" },
];

interface LiveBlock {
  id: string;
  numerator: number;
  denominator: number;
  color: string;
  smashOrigin?: string;
  fresh?: boolean;
  merged?: boolean; // true for blocks created by merging (distinct animation)
  // Track what was merged to create this block, so split can reverse it
  mergeParents?: { numerator: number; denominator: number }[];
}

let blockIdCounter = 0;
function nextBlockId() {
  return `block-${++blockIdCounter}`;
}

const STARTER_FRACTIONS: FractionData[] = [
  // The first match kids will find (tutor guides them here)
  { numerator: 1, denominator: 2, color: getFractionColor(1, 2) },
  { numerator: 2, denominator: 4, color: getFractionColor(2, 4) },
  // Second match to discover on their own
  { numerator: 1, denominator: 3, color: getFractionColor(1, 3) },
  { numerator: 2, denominator: 6, color: getFractionColor(2, 6) },
  // Complement pairs (make a whole)
  { numerator: 2, denominator: 3, color: getFractionColor(2, 3) },
  { numerator: 1, denominator: 4, color: getFractionColor(1, 4) },
  { numerator: 3, denominator: 4, color: getFractionColor(3, 4) },
  // One more equivalence hidden in plain sight
  { numerator: 3, denominator: 6, color: getFractionColor(3, 6) },
];

function buildStarterBlocks() {
  return STARTER_FRACTIONS.map((fraction) => ({
    id: nextBlockId(),
    ...fraction,
  }));
}

interface FractionWorkspaceProps {
  comparisonLeft: FractionData | null;
  comparisonRight: FractionData | null;
  onComparisonChange: (
    left: FractionData | null,
    right: FractionData | null
  ) => void;
  onMatch: (isEqual: boolean) => void;
  onSmashAction?: () => void;
  onMergeAction?: () => void;
  highlightedFractions?: string[];
  masteryLevel?: number;
  suggestedMode?: string | null;
  onModeSwitched?: () => void;
  unlockedModes?: string[];
  playerLevel?: number;
  onXP?: (amount: number, label: string) => void;
  onGameEvent?: (event: string) => void;
}

export default function FractionWorkspace({
  comparisonLeft,
  comparisonRight,
  onComparisonChange,
  onMatch,
  onSmashAction,
  onMergeAction,
  highlightedFractions,
  masteryLevel = 0,
  suggestedMode,
  onModeSwitched,
  unlockedModes = ["compare", "battle", "tower", "recipe", "pizza"],
  playerLevel = 0,
  onXP,
  onGameEvent,
}: FractionWorkspaceProps) {
  // Custom collision: comparison zones always win (rectIntersection),
  // merge targets only match via tight pointer-within and never self-target.
  const mergeAwareCollision: CollisionDetection = useCallback(
    (args) => {
      const activeId = args.active.id;

      const rectCollisions = rectIntersection(args);
      // Challenge zone droppables get priority (like comparison zones)
      const zoneHit = rectCollisions.find(
        (c) => {
          const cid = String(c.id);
          return cid === "comparison-left" || cid === "comparison-right"
            || cid === "battle-player" || cid === "tower-drop"
            || cid.startsWith("recipe-slot-")
            || cid.startsWith("pizza-slot-");
        }
      );
      if (zoneHit) return [zoneHit];

      const pointerCollisions = pointerWithin(args);
      const mergeHit = pointerCollisions.find((c) => {
        const cid = String(c.id);
        if (!cid.startsWith("merge-target-")) return false;
        const targetBlockId = cid.replace("merge-target-", "");
        return targetBlockId !== String(activeId);
      });
      if (mergeHit) return [mergeHit];

      return rectCollisions;
    },
    []
  );

  // Unlock 1 extra fraction per 2 mastery points (for reset pool and progression)
  const unlockedExtras = useMemo(() => {
    const count = Math.min(LOCKED_FRACTIONS.length, Math.floor(masteryLevel / 2));
    return LOCKED_FRACTIONS.slice(0, count);
  }, [masteryLevel]);

  const initialFractions = useMemo(
    () => [...AVAILABLE_FRACTIONS, ...BASE_EXTRA_FRACTIONS, ...unlockedExtras],
    [unlockedExtras],
  );

  // Starter blocks — 8 blocks forming clear discoverable pairs (initial load only)
  // Equivalence pairs: 1/2=2/4, 1/3=2/6; complement pairs: 1/3+2/3=1, 1/4+3/4=1
  const [blocks, setBlocks] = useState<LiveBlock[]>(() => buildStarterBlocks());
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);
  const [mergePreview, setMergePreview] = useState<{ numerator: number; denominator: number } | null>(null);
  const [smashLabel, setSmashLabel] = useState<{
    text: string;
    blockIds: string[];
    type: "smash" | "merge";
  } | null>(null);
  const [challengeMode, setChallengeMode] = useState<ChallengeMode>("compare");
  const [showNumberLine, setShowNumberLine] = useState(false);
  const [battleDrop, setBattleDrop] = useState<FractionDrop | null>(null);
  const [towerDrop, setTowerDrop] = useState<FractionDrop | null>(null);
  const [recipeDrop, setRecipeDrop] = useState<(FractionDrop & { droppableId: string }) | null>(null);
  const [pizzaDrop, setPizzaDrop] = useState<(FractionDrop & { droppableId: string }) | null>(null);
  const dropSeqRef = useRef(0);
  const smashLabelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // AI-suggested mode switch
  useEffect(() => {
    if (suggestedMode && CHALLENGE_TABS.some((t) => t.mode === suggestedMode)) {
      setChallengeMode(suggestedMode as ChallengeMode);
      onModeSwitched?.();
    }
  }, [suggestedMode, onModeSwitched]);

  // Detect equivalent fraction groups for shimmer effect
  const equivalentBlockIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const a = blocks[i], b = blocks[j];
        // Cross-multiply to check equivalence without fraction.js
        if (a.numerator * b.denominator === b.numerator * a.denominator) {
          // Only shimmer if they look different (different n/d text)
          if (a.numerator !== b.numerator || a.denominator !== b.denominator) {
            ids.add(a.id);
            ids.add(b.id);
          }
        }
      }
    }
    return ids;
  }, [blocks]);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 150, tolerance: 10 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const activeBlock = blocks.find((b) => b.id === activeDragId);

  const dismissLabel = useCallback(() => {
    setSmashLabel(null);
    setBlocks((curr) =>
      curr.map((b) => (b.fresh || b.merged ? { ...b, fresh: false, merged: false } : b))
    );
    if (smashLabelTimer.current) clearTimeout(smashLabelTimer.current);
  }, []);

  const showLabel = useCallback((text: string, blockIds: string[], type: "smash" | "merge") => {
    setSmashLabel({ text, blockIds, type });
    if (smashLabelTimer.current) clearTimeout(smashLabelTimer.current);
    smashLabelTimer.current = setTimeout(() => {
      setSmashLabel(null);
      setBlocks((curr) =>
        curr.map((b) => (b.fresh || b.merged ? { ...b, fresh: false, merged: false } : b))
      );
    }, 6000);
  }, []);

  // Use refs to avoid stale closures in callbacks
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  // Smash/Split: if block was merged, split back into original pieces; otherwise into unit fractions
  const handleSmash = useCallback((blockId: string) => {
    const current = blocksRef.current.find((b) => b.id === blockId);
    if (!current || current.numerator === 1) return;

    playSmash();

    let children: LiveBlock[];
    let labelText: string;

    if (current.mergeParents && current.mergeParents.length > 0) {
      // Reverse the merge — give back the original fractions
      children = current.mergeParents.map((p) => ({
        id: nextBlockId(),
        numerator: p.numerator,
        denominator: p.denominator,
        color: getFractionColor(p.numerator, p.denominator),
        smashOrigin: `${current.numerator}/${current.denominator}`,
        fresh: true,
      }));
      labelText = `${current.numerator}/${current.denominator} = ${children.map((c) => `${c.numerator}/${c.denominator}`).join(" + ")}`;
    } else {
      // Default: split into unit fractions
      children = Array.from(
        { length: current.numerator },
        () => ({
          id: nextBlockId(),
          numerator: 1,
          denominator: current.denominator,
          color: getFractionColor(1, current.denominator),
          smashOrigin: `${current.numerator}/${current.denominator}`,
          fresh: true,
        })
      );
      labelText = `${current.numerator}/${current.denominator} = ${children.map(() => `1/${current.denominator}`).join(" + ")}`;
    }

    const childIds = children.map((c) => c.id);

    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === blockId);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1, ...children);
      return next;
    });

    showLabel(labelText, childIds, "smash");
    onSmashAction?.();
  }, [showLabel, onSmashAction]);

  // Pairwise merge: combine source block into target block (cross-denominator)
  const handlePairMerge = useCallback((sourceId: string, targetId: string) => {
    const source = blocksRef.current.find((b) => b.id === sourceId);
    const target = blocksRef.current.find((b) => b.id === targetId);
    if (!source || !target) return;

    const result = canMergeFractions(
      source.numerator, source.denominator,
      target.numerator, target.denominator
    );
    if (!result) return;

    playMerge();

    const merged: LiveBlock = {
      id: nextBlockId(),
      numerator: result.numerator,
      denominator: result.denominator,
      color: getFractionColor(result.numerator, result.denominator),
      fresh: true,
      merged: true,
      // Remember what was merged so split can reverse it
      mergeParents: [
        { numerator: source.numerator, denominator: source.denominator },
        { numerator: target.numerator, denominator: target.denominator },
      ],
    };

    setBlocks((prev) => {
      const targetIdx = prev.findIndex((b) => b.id === targetId);
      const filtered = prev.filter(
        (b) => b.id !== sourceId && b.id !== targetId
      );
      const insertIdx = Math.min(targetIdx, filtered.length);
      filtered.splice(insertIdx, 0, merged);
      return filtered;
    });

    showLabel(
      buildMergeLabel(
        source.numerator, source.denominator,
        target.numerator, target.denominator,
        result.numerator, result.denominator
      ),
      [merged.id],
      "merge"
    );
    onMergeAction?.();
  }, [showLabel, onMergeAction]);

  // Button fallback merge: find first compatible neighbor (any denominator)
  const handleMerge = useCallback((blockId: string) => {
    const block = blocksRef.current.find((b) => b.id === blockId);
    if (!block) return;
    const sibling = blocksRef.current.find(
      (b) =>
        b.id !== blockId &&
        canMergeFractions(block.numerator, block.denominator, b.numerator, b.denominator) !== null
    );
    if (!sibling) return;
    handlePairMerge(blockId, sibling.id);
  }, [handlePairMerge]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    setSelectedBlockId(null); // hide buttons when dragging
    playPickup();
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event;

    if (!over || !active.data.current) {
      setMergeTargetId(null);
      setMergePreview(null);
      return;
    }

    const overId = String(over.id);

    if (overId.startsWith("merge-target-")) {
      const targetBlockId = overId.replace("merge-target-", "");
      const activeBlockId = String(active.id);

      if (targetBlockId === activeBlockId) {
        setMergeTargetId(null);
        setMergePreview(null);
        return;
      }

      const targetData = over.data.current;
      const activeData = active.data.current;

      if (targetData && activeData) {
        const result = canMergeFractions(
          activeData.numerator, activeData.denominator,
          targetData.numerator, targetData.denominator
        );
        if (result) {
          setMergeTargetId(targetBlockId);
          setMergePreview(result);
          return;
        }
      }
    }

    setMergeTargetId(null);
    setMergePreview(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;

    setMergeTargetId(null);
    setMergePreview(null);
    setActiveDragId(null);

    if (!over || !active.data.current) return;

    const overId = String(over.id);

    // Merge drop
    if (overId.startsWith("merge-target-")) {
      const targetBlockId = overId.replace("merge-target-", "");
      const activeBlockId = String(active.id);

      if (targetBlockId === activeBlockId) return;

      const targetData = over.data.current;
      const activeData = active.data.current;

      if (targetData && activeData) {
        const result = canMergeFractions(
          activeData.numerator, activeData.denominator,
          targetData.numerator, targetData.denominator
        );
        if (result) {
          handlePairMerge(activeBlockId, targetBlockId);
          return;
        }
      }
      return;
    }

    // Build common fraction data from the dragged piece
    const fraction: FractionData = {
      numerator: active.data.current.numerator,
      denominator: active.data.current.denominator,
      color: active.data.current.color,
    };

    playDrop();

    // Challenge mode drops
    if (overId === "battle-player") {
      const seq = ++dropSeqRef.current;
      setBattleDrop({ ...fraction, _seq: seq });
      return;
    }
    if (overId === "tower-drop") {
      const seq = ++dropSeqRef.current;
      setTowerDrop({ ...fraction, _seq: seq });
      return;
    }
    if (overId.startsWith("recipe-slot-")) {
      const seq = ++dropSeqRef.current;
      setRecipeDrop({ ...fraction, _seq: seq, droppableId: overId });
      return;
    }
    if (overId.startsWith("pizza-slot-")) {
      const seq = ++dropSeqRef.current;
      setPizzaDrop({ ...fraction, _seq: seq, droppableId: overId });
      return;
    }

    // Comparison zone drop
    let newLeft = comparisonLeft;
    let newRight = comparisonRight;

    if (over.id === "comparison-left") {
      newLeft = fraction;
    } else if (over.id === "comparison-right") {
      newRight = fraction;
    } else {
      return;
    }

    onComparisonChange(newLeft, newRight);

    if (newLeft && newRight) {
      const equal = areFractionsEqual(newLeft, newRight);
      setTimeout(() => {
        onMatch(equal);
        if (equal) {
          playSuccess();
        } else {
          playError();
        }
      }, 300);
    }
  };

  const isMatch =
    comparisonLeft &&
    comparisonRight &&
    areFractionsEqual(comparisonLeft, comparisonRight);

  const scaledWidth = (n: number, d: number) =>
    Math.min(150, Math.max(70, Math.round((n / d) * 140)));

  const isFractionHighlighted = (num: number, den: number) => {
    if (!highlightedFractions || highlightedFractions.length === 0) return false;
    return highlightedFractions.includes(`${num}/${den}`);
  };

  const hasCompatibleNeighbor = (block: LiveBlock) => {
    return blocks.some(
      (b) =>
        b.id !== block.id &&
        canMergeFractions(block.numerator, block.denominator, b.numerator, b.denominator) !== null
    );
  };

  const resetWorkspace = useCallback(() => {
    playReset();
    setBlocks(
      initialFractions.map((f) => ({ id: nextBlockId(), ...f })),
    );
    setSmashLabel(null);
    setSelectedBlockId(null);
    setActiveDragId(null);
    setMergeTargetId(null);
    setMergePreview(null);
    setBattleDrop(null);
    setTowerDrop(null);
    setRecipeDrop(null);
    setPizzaDrop(null);
    onComparisonChange(null, null);
  }, [initialFractions, onComparisonChange]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={mergeAwareCollision}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        className="h-full flex flex-col bg-white rounded-[2rem] shadow-xl border-4 border-amber-100/50 overflow-hidden relative fraction-workspace"
        data-no-select
      >

        {/* Header — immersive adventure style */}
        <div className="px-4 py-2.5 bg-gradient-to-b from-amber-50 to-white border-b-2 border-amber-100/40 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center gap-1.5 opacity-60">
                <span>🌴</span> Fraction Lab
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-amber-950">Workspace</span>
                {selectedBlockId && (
                  <motion.span 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }}
                    className="px-2 py-0.5 bg-pink-100 text-pink-600 text-[10px] font-black rounded-full uppercase"
                  >
                    Block Selected!
                  </motion.span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNumberLine((v) => !v)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all btn-squishy ${
                  showNumberLine
                    ? "bg-amber-400 text-white"
                    : "bg-white border-2 border-amber-100 text-amber-400"
                }`}
                aria-label={showNumberLine ? "Hide number line" : "Show number line"}
                title="Toggle Number Line"
              >
                📏
              </button>
              <button
                onClick={resetWorkspace}
                className="w-10 h-10 rounded-2xl bg-white border-2 border-red-50 text-red-300 flex items-center justify-center transition-all btn-squishy active:bg-red-50"
                aria-label="Reset fraction workspace"
                title="Reset Workspace"
              >
                🔄
              </button>
            </div>
          </div>
        </div>

        {/* Equation label banner */}
        <AnimatePresence>
          {smashLabel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div
                onClick={dismissLabel}
                className={`px-4 py-2.5 border-b text-center cursor-pointer flex items-center justify-center gap-2 ${
                  smashLabel.type === "smash"
                    ? "bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-amber-200"
                    : "bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300"
                }`}
              >
                <motion.span
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="text-base"
                >
                  {smashLabel.type === "smash" ? "💥" : "🧩"}
                </motion.span>
                {smashLabel.type === "merge" ? (
                  <span className="flex items-center gap-1.5 text-sm font-bold">
                    {smashLabel.text.split(" = ").map((part, i, arr) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.15 + 0.1 }}
                        className={
                          i === arr.length - 1
                            ? "text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-extrabold"
                            : "text-emerald-600"
                        }
                      >
                        {i > 0 && <span className="text-emerald-400 mr-1.5">=</span>}
                        {part}
                      </motion.span>
                    ))}
                  </span>
                ) : (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-sm font-bold text-amber-700"
                  >
                    {smashLabel.text}
                  </motion.span>
                )}
                <motion.span
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15, delay: smashLabel.type === "merge" ? 0.4 : 0.15 }}
                  className="text-base"
                >
                  {smashLabel.type === "smash" ? "💥" : "✨"}
                </motion.span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissLabel();
                  }}
                  className={`text-xs font-bold ml-1 ${
                    smashLabel.type === "smash"
                      ? "text-amber-400 hover:text-amber-600"
                      : "text-emerald-400 hover:text-emerald-600"
                  }`}
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Number line — hidden by default, toggled from header */}
        <AnimatePresence>
          {showNumberLine && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden px-4 border-b border-gray-100"
            >
              <NumberLine
                fractions={blocks.map((b) => ({
                  id: b.id,
                  numerator: b.numerator,
                  denominator: b.denominator,
                  color: b.color,
                }))}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fraction pieces area with Jungle Floor */}
        <div className="flex-1 overflow-y-auto jungle-floor px-3 py-4 relative">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 justify-items-center py-2">
            {blocks.map((block) => {
              const isGuidedHighlight = isFractionHighlighted(
                block.numerator,
                block.denominator
              );
              const isMTarget = mergeTargetId === block.id;
              const isSelected = selectedBlockId === block.id;

              return (
                <div
                  key={block.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBlockId(isSelected ? null : block.id);
                  }}
                  className="relative transition-transform duration-200"
                  style={{ zIndex: isSelected ? 40 : 10 }}
                >
                  <FractionPiece
                    id={block.id}
                    numerator={block.numerator}
                    denominator={block.denominator}
                    color={block.color}
                    onSmash={
                      isSelected && block.numerator > 1
                        ? () => { handleSmash(block.id); setSelectedBlockId(null); }
                        : undefined
                    }
                    onMerge={
                      isSelected && hasCompatibleNeighbor(block)
                        ? () => { handleMerge(block.id); setSelectedBlockId(null); }
                        : undefined
                    }
                    highlighted={isGuidedHighlight}
                    isMergeTarget={isMTarget}
                    mergePreview={isMTarget ? mergePreview : null}
                    isEquivalentShimmer={equivalentBlockIds.has(block.id)}
                  />
                  {isSelected && (
                    <motion.div 
                      layoutId="block-select-ring"
                      className="absolute -inset-3 border-4 border-pink-400 rounded-[2rem] pointer-events-none z-0"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Floating Action Menu — Backpack & Build */}
          <div className="sticky bottom-4 left-0 right-0 flex items-center justify-center gap-3 z-50 pointer-events-none pb-2">
            <div className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border-2 border-amber-100/50">
              <Backpack
                onSelectTool={(tool) => {
                  if (tool === "random") {
                    const existing = blocks.map((b) => ({ numerator: b.numerator, denominator: b.denominator, color: b.color }));
                    const newFrac = getRandomFraction(existing, initialFractions);
                    playPickup();
                    setBlocks((prev) => [...prev, { id: nextBlockId(), ...newFrac, fresh: true }]);
                  } else if (tool === "split" && selectedBlockId) {
                    handleSmash(selectedBlockId);
                    setSelectedBlockId(null);
                  } else if (tool === "merge" && selectedBlockId) {
                    handleMerge(selectedBlockId);
                    setSelectedBlockId(null);
                  }
                }}
              />
              <div className="w-px h-8 bg-amber-100" />
              <FractionBuilder
                onBuild={(frac) => {
                  playPickup();
                  setBlocks((prev) => [
                    ...prev,
                    { id: nextBlockId(), ...frac, fresh: true },
                  ]);
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const existing = blocks.map((b) => ({ numerator: b.numerator, denominator: b.denominator, color: b.color }));
                  const newFrac = getRandomFraction(existing, initialFractions);
                  playPickup();
                  setBlocks((prev) => [...prev, { id: nextBlockId(), ...newFrac, fresh: true }]);
                }}
                className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-2xl shadow-md btn-squishy flex items-center justify-center text-xl"
                aria-label="Add a random fraction block"
                title="Get Random Block"
              >
                🎲
              </button>
            </div>
          </div>
        </div>

        {/* Challenge Zone — the adventure area */}
        <div className="bg-white border-t-4 border-amber-100/40 relative z-20">
          {/* Challenge mode "Navigator" tabs */}
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide bg-amber-50/30">
            {CHALLENGE_TABS.map((tab) => {
              const isUnlocked = unlockedModes.includes(tab.mode);
              const unlockLevel = MODE_UNLOCK_LEVELS[tab.mode] ?? 0;
              const isActive = challengeMode === tab.mode;
              
              return (
              <button
                key={tab.mode}
                onClick={() => {
                  if (!isUnlocked) return;
                  const prev = challengeMode;
                  setChallengeMode(tab.mode);
                  if (tab.mode !== prev) {
                    onGameEvent?.(`[Student switched to ${tab.label} (${tab.emoji}) mode. Give a casual tip for this mode.]`);
                  }
                }}
                className={`flex-shrink-0 px-4 py-2.5 rounded-2xl font-black text-xs transition-all btn-squishy flex items-center gap-2 ${
                  !isUnlocked
                    ? "bg-gray-100 text-gray-300 border border-gray-200 cursor-default opacity-50"
                    : isActive
                    ? "bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-lg"
                    : "bg-white text-amber-700 border-2 border-amber-100 active:bg-amber-50"
                }`}
              >
                <span className="text-lg">{isUnlocked ? tab.emoji : "🔒"}</span>
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-tab-dot"
                    className="w-1.5 h-1.5 bg-white rounded-full"
                  />
                )}
              </button>
              );
            })}
          </div>

          <div className="p-4 pt-2 min-h-[160px] relative">
            {/* Compare mode (original) */}
            {challengeMode === "compare" && (
              <div className="flex flex-col gap-4">
                <div className="flex gap-3 items-center justify-center">
                  <ComparisonZone
                    side="left"
                    fraction={comparisonLeft}
                    onClear={() => onComparisonChange(null, comparisonRight)}
                    onTapPlace={selectedBlockId ? () => {
                      const block = blocks.find(b => b.id === selectedBlockId);
                      if (block) {
                        onComparisonChange({ numerator: block.numerator, denominator: block.denominator, color: block.color }, comparisonRight);
                        setSelectedBlockId(null);
                        playDrop();
                      }
                    } : undefined}
                  />
                  
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <motion.div
                      animate={isMatch ? { rotate: 360 } : { rotate: 0 }}
                      transition={{ duration: 2, repeat: isMatch ? Infinity : 0, ease: "linear" }}
                      className={`absolute inset-0 rounded-full border-4 border-dashed ${isMatch ? "border-emerald-400 opacity-40" : "border-amber-100 opacity-20"}`}
                    />
                    <motion.span
                      animate={
                        isMatch
                          ? { scale: [1, 1.4, 1], color: ["#d1d5db", "#10b981", "#10b981"] }
                          : { scale: 1, color: "#d1d5db" }
                      }
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className="text-2xl font-black relative z-10"
                    >
                      {isMatch ? "=" : "?"}
                    </motion.span>
                  </div>

                  <ComparisonZone
                    side="right"
                    fraction={comparisonRight}
                    onClear={() => onComparisonChange(comparisonLeft, null)}
                    onTapPlace={selectedBlockId ? () => {
                      const block = blocks.find(b => b.id === selectedBlockId);
                      if (block) {
                        onComparisonChange(comparisonLeft, { numerator: block.numerator, denominator: block.denominator, color: block.color });
                        setSelectedBlockId(null);
                        playDrop();
                      }
                    } : undefined}
                  />
                </div>

                {/* Result indicator — Clean & Impressive */}
                <AnimatePresence>
                  {comparisonLeft && comparisonRight && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`p-4 rounded-3xl text-center shadow-xl border-2 flex items-center justify-center gap-3 ${
                        areFractionsEqual(comparisonLeft, comparisonRight)
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-amber-50 border-amber-200 text-amber-800"
                      }`}
                    >
                      <span className="text-2xl">
                        {areFractionsEqual(comparisonLeft, comparisonRight) ? "🌟" : "🧗"}
                      </span>
                      <p className="text-sm font-black">
                        {areFractionsEqual(comparisonLeft, comparisonRight) 
                          ? "Perfect Match! You found a twin!" 
                          : "Almost! They are different sizes. Try another!"}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Battle mode */}
            {challengeMode === "battle" && <FractionBattle pendingDrop={battleDrop} playerLevel={playerLevel} onXP={onXP} onGameEvent={onGameEvent} />}

            {/* Tower mode */}
            {challengeMode === "tower" && <TowerChallenge pendingDrop={towerDrop} onXP={onXP} />}

            {/* Recipe mode */}
            {challengeMode === "recipe" && <RecipeChallenge pendingDrop={recipeDrop} onXP={onXP} />}

            {/* Pizza mode */}
            {challengeMode === "pizza" && <PizzaChallenge pendingDrop={pizzaDrop} onXP={onXP} />}

            {/* Rain mode */}
            {challengeMode === "rain" && <FractionRain onXP={onXP} />}
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={{ duration: 200, easing: "ease-out" }}>
        {activeBlock ? (
          <motion.div
            initial={{ scale: 1.1 }}
            animate={{
              scale: mergeTargetId ? 1.18 : 1.12,
              rotate: mergeTargetId ? 0 : [1.5, -1.5, 1.5],
            }}
            transition={{
              scale: { type: "spring", stiffness: 300, damping: 20 },
              rotate: mergeTargetId
                ? { type: "tween", duration: 0.15 }
                : { type: "tween", repeat: Infinity, duration: 0.8, ease: "easeInOut" },
            }}
            className="relative"
            style={{
              opacity: 0.92,
              filter: mergeTargetId
                ? "drop-shadow(0 0 10px rgba(16, 185, 129, 0.5))"
                : "drop-shadow(0 8px 16px rgba(0,0,0,0.18))",
            }}
          >
            <FractionBar
              numerator={activeBlock.numerator}
              denominator={activeBlock.denominator}
              color={activeBlock.color}
              width={scaledWidth(
                activeBlock.numerator,
                activeBlock.denominator
              )}
              height={36}
            />
            {/* Green merge badge on drag overlay */}
            <AnimatePresence>
              {mergeTargetId && (
                <motion.div
                  key="merge-badge"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute -top-3 -left-3 w-7 h-7 bg-gradient-to-br from-emerald-400 to-green-500 text-white text-sm font-bold rounded-full flex items-center justify-center shadow-lg pointer-events-none"
                >
                  +
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
