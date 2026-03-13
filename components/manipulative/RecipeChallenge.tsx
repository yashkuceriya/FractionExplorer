"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { FractionDrop } from "./FractionBattle";
import { motion, AnimatePresence } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { simplifyPair, fractionsEqualRaw } from "@/lib/fractions";

// ── Types ────────────────────────────────────────────────────────────────────

interface RecipeChallengeProps {
  onComplete?: (recipeName: string) => void;
  pendingDrop?: FractionDrop & { droppableId: string } | null;
  onXP?: (amount: number, label: string) => void;
}

interface Fraction {
  numerator: number;
  denominator: number;
}

interface Ingredient {
  name: string;
  emoji: string;
  amount: Fraction;
}

interface Recipe {
  name: string;
  emoji: string;
  serves: number;
  ingredients: Ingredient[];
}

type SlotStatus = "empty" | "correct" | "wrong";

interface SlotState {
  status: SlotStatus;
  droppedFraction: Fraction | null;
}

// ── Fraction math (using shared helpers) ─────────────────────────────────────

function simplify(n: number, d: number): Fraction {
  return simplifyPair(n, d);
}

function scaleFraction(f: Fraction, multiplier: number): Fraction {
  return simplify(f.numerator * multiplier, f.denominator);
}

function fractionsEqual(a: Fraction, b: Fraction): boolean {
  return fractionsEqualRaw(a, b);
}

function fractionToString(f: Fraction): string {
  if (f.numerator === 0) return "0";
  if (f.denominator === 1) return `${f.numerator}`;
  return `${f.numerator}/${f.denominator}`;
}


// ── Recipe data ──────────────────────────────────────────────────────────────

const RECIPES: Recipe[] = [
  {
    name: "Cookie Dough 🍪",
    emoji: "🍪",
    serves: 1,
    ingredients: [
      { name: "Flour", emoji: "🌾", amount: { numerator: 1, denominator: 2 } },
      { name: "Sugar", emoji: "🍬", amount: { numerator: 1, denominator: 4 } },
      { name: "Butter", emoji: "🧈", amount: { numerator: 1, denominator: 8 } },
    ],
  },
  {
    name: "Magic Smoothie 🧃",
    emoji: "🧃",
    serves: 1,
    ingredients: [
      { name: "Berries", emoji: "🫐", amount: { numerator: 1, denominator: 3 } },
      { name: "Yogurt", emoji: "🥛", amount: { numerator: 1, denominator: 6 } },
      { name: "Milk", emoji: "🥛", amount: { numerator: 1, denominator: 2 } },
    ],
  },
  {
    name: "Pizza Party 🍕",
    emoji: "🍕",
    serves: 1,
    ingredients: [
      { name: "Cheese", emoji: "🧀", amount: { numerator: 2, denominator: 3 } },
      { name: "Sauce", emoji: "🍅", amount: { numerator: 1, denominator: 4 } },
      { name: "Dough", emoji: "🫓", amount: { numerator: 1, denominator: 2 } },
    ],
  },
  {
    name: "Rainbow Cake 🎂",
    emoji: "🎂",
    serves: 1,
    ingredients: [
      { name: "Cake Mix", emoji: "🎂", amount: { numerator: 3, denominator: 4 } },
      { name: "Frosting", emoji: "🧁", amount: { numerator: 1, denominator: 2 } },
      { name: "Sprinkles", emoji: "✨", amount: { numerator: 1, denominator: 8 } },
    ],
  },
];

// ── Procedural recipe generation ─────────────────────────────────────────────

const INGREDIENT_POOL: { name: string; emoji: string }[] = [
  { name: "Flour", emoji: "🌾" },
  { name: "Sugar", emoji: "🍬" },
  { name: "Butter", emoji: "🧈" },
  { name: "Berries", emoji: "🫐" },
  { name: "Milk", emoji: "🥛" },
  { name: "Honey", emoji: "🍯" },
  { name: "Chocolate", emoji: "🍫" },
  { name: "Vanilla", emoji: "🍦" },
  { name: "Eggs", emoji: "🥚" },
  { name: "Cream", emoji: "🍨" },
  { name: "Strawberry", emoji: "🍓" },
  { name: "Banana", emoji: "🍌" },
  { name: "Coconut", emoji: "🥥" },
  { name: "Cinnamon", emoji: "✨" },
  { name: "Peanut Butter", emoji: "🥜" },
];

const RECIPE_ADJECTIVES = ["Magic", "Super", "Rainbow", "Golden", "Secret", "Sparkle"];
const RECIPE_NOUNS = ["Cake", "Smoothie", "Pancake", "Cookie", "Potion", "Muffin"];
const RECIPE_EMOJIS = ["🎂", "🧃", "🥞", "🍪", "🧪", "🧁"];

const FRACTION_POOL: Fraction[] = [
  { numerator: 1, denominator: 2 },
  { numerator: 1, denominator: 3 },
  { numerator: 1, denominator: 4 },
  { numerator: 1, denominator: 5 },
  { numerator: 1, denominator: 6 },
  { numerator: 1, denominator: 8 },
  { numerator: 2, denominator: 3 },
  { numerator: 3, denominator: 4 },
  { numerator: 2, denominator: 4 },
];

function pickRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateRecipe(): Recipe {
  const adjIdx = Math.floor(Math.random() * RECIPE_ADJECTIVES.length);
  const nounIdx = Math.floor(Math.random() * RECIPE_NOUNS.length);
  const ingredientCount = 2 + Math.floor(Math.random() * 2); // 2-3

  const pickedIngredients = pickRandomItems(INGREDIENT_POOL, ingredientCount);
  const pickedFractions = pickRandomItems(FRACTION_POOL, ingredientCount);

  return {
    name: `${RECIPE_ADJECTIVES[adjIdx]} ${RECIPE_NOUNS[nounIdx]} ${RECIPE_EMOJIS[nounIdx]}`,
    emoji: RECIPE_EMOJIS[nounIdx],
    serves: 1,
    ingredients: pickedIngredients.map((ing, i) => ({
      name: ing.name,
      emoji: ing.emoji,
      amount: pickedFractions[i],
    })),
  };
}

// First 2 are tutorial (hardcoded), rest are procedural
function getRecipes(): Recipe[] {
  const base = RECIPES.slice(0, 2);
  // Generate 3 procedural recipes
  for (let i = 0; i < 3; i++) {
    base.push(generateRecipe());
  }
  return base;
}

// ── Droppable ingredient slot ────────────────────────────────────────────────

function IngredientSlot({
  id,
  ingredient,
  target,
  slotState,
  onDrop,
}: {
  id: string;
  ingredient: Ingredient;
  target: Fraction;
  slotState: SlotState;
  onDrop: (ingredientId: string, fraction: Fraction) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <motion.div
      ref={setNodeRef}
      className="flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 transition-colors"
      style={{
        borderColor: isOver
          ? "#f59e0b"
          : slotState.status === "correct"
          ? "#22c55e"
          : slotState.status === "wrong"
          ? "#ef4444"
          : "#d6b88a",
        backgroundColor: isOver
          ? "rgba(245, 158, 11, 0.08)"
          : slotState.status === "correct"
          ? "rgba(34, 197, 94, 0.08)"
          : "rgba(255, 255, 255, 0.6)",
      }}
      animate={
        slotState.status === "wrong"
          ? { x: [0, -6, 6, -4, 4, 0] }
          : slotState.status === "correct"
          ? { scale: [1, 1.08, 0.97, 1.02, 1] }
          : {}
      }
      transition={{ type: "tween", duration: 0.4 }}
    >
      {/* Ingredient info */}
      <span className="text-2xl" aria-hidden>
        {ingredient.emoji}
      </span>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-sm font-semibold text-amber-900">
          {ingredient.name}
        </span>
        <span className="text-xs text-amber-700">
          Need: <span className="font-bold">{fractionToString(target)}</span> cup
        </span>
      </div>

      {/* Drop target / result */}
      <div className="relative flex items-center justify-center w-16 h-12 rounded-lg bg-amber-50 border border-amber-200 shadow-inner">
        {slotState.status === "empty" && (
          <motion.span
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ type: "tween", repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="text-amber-400 text-xs font-medium select-none"
          >
            drop
          </motion.span>
        )}

        <AnimatePresence mode="wait">
          {slotState.status === "correct" && slotState.droppedFraction && (
            <motion.div
              key="correct"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 0.95, 1], opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "tween", duration: 0.35 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="text-green-600 font-bold text-sm">
                {fractionToString(slotState.droppedFraction)} ✅
              </span>
            </motion.div>
          )}

          {slotState.status === "wrong" && (
            <motion.div
              key="wrong"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ type: "tween", duration: 0.25 }}
              className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md shadow"
            >
              Not quite!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Confetti rain overlay ────────────────────────────────────────────────────

const CONFETTI_EMOJIS = ["🎉", "🎊", "⭐", "🍰", "🧁", "✨", "🎈"];

function ConfettiRain() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length],
        left: `${5 + Math.random() * 90}%`,
        delay: Math.random() * 0.8,
        duration: 1.4 + Math.random() * 1,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -30, opacity: 1, rotate: 0 }}
          animate={{ y: "110%", opacity: 0, rotate: 360 }}
          transition={{
            type: "tween",
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
          }}
          className="absolute text-xl"
          style={{ left: p.left }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function RecipeChallenge({ onComplete, pendingDrop, onXP }: RecipeChallengeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scaleMultiplier, setScaleMultiplier] = useState(1);
  const [slots, setSlots] = useState<Record<string, SlotState>>({});
  const [celebrating, setCelebrating] = useState(false);
  const [allDone, setAllDone] = useState(false);

  // Stable recipe list (first 2 hardcoded + procedural)
  const allRecipes = useMemo(() => getRecipes(), []);
  const recipe = allRecipes[currentIndex];

  /** Scaled ingredient targets */
  const scaledIngredients = useMemo(
    () =>
      recipe.ingredients.map((ing) => ({
        ...ing,
        target: scaleFraction(ing.amount, scaleMultiplier),
      })),
    [recipe, scaleMultiplier],
  );

  /** Number of correct slots for current recipe */
  const correctCount = useMemo(() => {
    return scaledIngredients.filter((_, i) => {
      const key = `${currentIndex}-${i}`;
      return slots[key]?.status === "correct";
    }).length;
  }, [slots, scaledIngredients, currentIndex]);

  const allCorrect = correctCount === scaledIngredients.length;

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleDrop(ingredientKey: string, dropped: Fraction) {
    // key format: "recipe-slot-{recipeIdx}-{ingredientIdx}"
    const parts = ingredientKey.split("-");
    const idx = Number(parts[parts.length - 1]);
    const target = scaledIngredients[idx]?.target;
    if (!target) return;

    const isCorrect = fractionsEqual(dropped, target);

    setSlots((prev) => ({
      ...prev,
      [ingredientKey]: {
        status: isCorrect ? "correct" : "wrong",
        droppedFraction: dropped,
      },
    }));

    // Clear wrong status after a beat
    if (!isCorrect) {
      setTimeout(() => {
        setSlots((prev) => {
          const current = prev[ingredientKey];
          if (current?.status !== "wrong") return prev;
          return { ...prev, [ingredientKey]: { status: "empty", droppedFraction: null } };
        });
      }, 1200);
    }
  }

  // React to drops forwarded from parent workspace
  const lastSeq = useRef(-1);
  useEffect(() => {
    if (pendingDrop && pendingDrop._seq !== lastSeq.current) {
      lastSeq.current = pendingDrop._seq;
      handleDrop(pendingDrop.droppableId, { numerator: pendingDrop.numerator, denominator: pendingDrop.denominator });
    }
  }, [pendingDrop]); // eslint-disable-line react-hooks/exhaustive-deps

  /** After all correct — celebrate & advance */
  function triggerCelebration() {
    setCelebrating(true);
    onComplete?.(recipe.name);
    onXP?.(2, "Recipe done!");

    setTimeout(() => {
      setCelebrating(false);
      if (currentIndex < allRecipes.length - 1) {
        setCurrentIndex((i) => i + 1);
        setScaleMultiplier(1);
        setSlots({});
      } else {
        setAllDone(true);
      }
    }, 2000);
  }

  // Auto-celebrate when all correct
  useEffect(() => {
    if (allCorrect && scaledIngredients.length > 0 && !celebrating && !allDone) {
      // Small delay so the last checkmark animation plays first
      setTimeout(triggerCelebration, 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCorrect]);

  function selectRecipe(index: number) {
    if (celebrating) return;
    setCurrentIndex(index);
    setScaleMultiplier(1);
    setSlots({});
    setAllDone(false);
    setCelebrating(false);
  }

  function toggleScale() {
    setScaleMultiplier((m) => (m === 1 ? 2 : 1));
    // Reset slots when scale changes since targets changed
    setSlots({});
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative flex flex-col items-center gap-4 w-full max-w-md mx-auto select-none">
      {/* Progress */}
      <div className="text-sm font-semibold text-amber-800 tracking-wide">
        Recipe {currentIndex + 1}/{allRecipes.length}
      </div>

      {/* Recipe selector pills */}
      <div className="flex gap-2 flex-wrap justify-center">
        {allRecipes.map((r, i) => (
          <button
            key={`${r.name}-${i}`}
            onClick={() => selectRecipe(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border-2 ${
              i === currentIndex
                ? "bg-amber-500 text-white border-amber-600 shadow-md scale-105"
                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
            }`}
          >
            {r.emoji} {r.name.replace(/ .+$/, "")}
          </button>
        ))}
      </div>

      {/* Recipe card */}
      <motion.div
        layout
        animate={
          celebrating
            ? { scale: [1, 1.06, 0.97, 1.03, 1] }
            : { scale: 1 }
        }
        transition={{ type: "tween", duration: 0.6 }}
        className="relative w-full rounded-2xl overflow-hidden shadow-lg"
        style={{
          background: "linear-gradient(145deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)",
        }}
      >
        {/* Celebration overlay */}
        <AnimatePresence>
          {celebrating && <ConfettiRain />}
        </AnimatePresence>

        {/* Card header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{recipe.emoji}</span>
            <div>
              <h2 className="text-lg font-bold text-amber-900 leading-tight">
                {recipe.name}
              </h2>
              <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-200 text-amber-800">
                Serves {recipe.serves * scaleMultiplier}
              </span>
            </div>
          </div>

          {/* Scale button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleScale}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow transition-colors ${
              scaleMultiplier === 2
                ? "bg-orange-500 text-white"
                : "bg-white text-amber-800 border border-amber-300"
            }`}
          >
            {scaleMultiplier === 2 ? "Back to 1×" : "Make for 2! 🍴"}
          </motion.button>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-amber-300/50" />

        {/* Ingredients */}
        <div className="flex flex-col gap-2 px-5 py-4">
          {scaledIngredients.map((ing, i) => {
            const key = `recipe-slot-${currentIndex}-${i}`;
            const slotState: SlotState = slots[key] ?? {
              status: "empty",
              droppedFraction: null,
            };
            return (
              <IngredientSlot
                key={key}
                id={key}
                ingredient={ing}
                target={ing.target}
                slotState={slotState}
                onDrop={handleDrop}
              />
            );
          })}
        </div>

        {/* Celebration banner */}
        <AnimatePresence>
          {celebrating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "tween", duration: 0.3 }}
              className="mx-5 mb-4 py-3 rounded-xl bg-green-500 text-white text-center font-extrabold text-lg shadow-md"
            >
              Delicious! 🎉
            </motion.div>
          )}
        </AnimatePresence>

        {/* All done banner */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "tween", duration: 0.4 }}
              className="mx-5 mb-4 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center font-extrabold text-lg shadow-md"
            >
              🏆 All Done — Master Chef! 🏆
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {allRecipes.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentIndex
                ? "bg-amber-500"
                : i < currentIndex
                ? "bg-green-400"
                : "bg-amber-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
