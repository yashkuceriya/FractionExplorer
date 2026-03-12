"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useChat } from "ai/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ChatPanel from "@/components/chat/ChatPanel";
import FractionWorkspace from "@/components/manipulative/FractionWorkspace";
import ProgressTracker from "@/components/feedback/ProgressTracker";
import Celebration from "@/components/feedback/Celebration";
import SwiperFeedback from "@/components/feedback/SwiperFeedback";
import CompletionScreen from "@/components/feedback/CompletionScreen";
import VoiceNarrator from "@/components/voice/VoiceNarrator";
import UsageStats from "@/components/feedback/UsageStats";
import OnboardingOverlay from "@/components/manipulative/OnboardingOverlay";
import TrophyWall from "@/components/feedback/TrophyWall";
import StreakCounter from "@/components/feedback/StreakCounter";
import PhaseTransitionCard from "@/components/feedback/PhaseTransitionCard";
import FractionMap from "@/components/feedback/FractionMap";
import { type FractionData, fractionToString, areFractionsEqual } from "@/lib/fractions";
import {
  type LessonState,
  INITIAL_LESSON_STATE,
  advanceLesson,
} from "@/lib/ai/lesson-context";
import { loadTrophies, saveTrophy, type Trophy } from "@/lib/trophy";
import {
  loadEarnedBadges,
  checkNewBadges,
  BADGE_DEFINITIONS,
  type StudentStats,
} from "@/lib/badges";
import { loadProgress, addXP, incrementStat, persistMastery, recordDiscovery, type XPResult } from "@/lib/progress";
import { isMuted, setMuted, isMusicMuted, setMusicMuted, startMusic, stopMusic, playStreakMilestone } from "@/lib/sounds";
import XPBar from "@/components/feedback/XPBar";
import SessionGoalCard from "@/components/feedback/SessionGoalCard";
import MissionCard from "@/components/feedback/MissionCard";
import VoiceCharacterPicker from "@/components/voice/VoiceCharacterPicker";
import { loadSelectedCharacter, type VoiceCharacter } from "@/lib/voice-characters";
import { generateChallenge, checkAnswer, type Challenge } from "@/lib/challenges";

interface MatchRecord {
  left: string;
  right: string;
  equal: boolean;
}

// Session persistence keys
const STORAGE_KEY = "synthesis-tutor-session";

function saveSession(state: {
  lessonState: LessonState;
  matchHistory: MatchRecord[];
}) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable — ignore
  }
}

function loadSession(): {
  lessonState: LessonState;
  matchHistory: MatchRecord[];
} | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export default function LessonPage() {
  const router = useRouter();
  const [lessonState, setLessonState] = useState<LessonState>(INITIAL_LESSON_STATE);
  const [comparisonLeft, setComparisonLeft] = useState<FractionData | null>(null);
  const [comparisonRight, setComparisonRight] = useState<FractionData | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showSwiper, setShowSwiper] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Voice-first for kids
  const [lastTutorMessage, setLastTutorMessage] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const hasInitialized = useRef(false);

  // Phase 2: Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  const onboardingChecked = useRef(false);

  // Phase 3: Trophies, Badges, Streak
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [studentStats, setStudentStats] = useState<StudentStats>({
    matches: 0,
    smashes: 0,
    merges: 0,
    streak: 0,
    uniquePairs: 0,
  });
  const [badgeToast, setBadgeToast] = useState<string | null>(null);

  // Mastery level unlocks extra fraction pieces in workspace
  // Persisted via progress system
  const [masteryLevel, setMasteryLevel] = useState(() => loadProgress().masteryLevel);

  // Progress / XP system
  const [playerProgress, setPlayerProgress] = useState(() => loadProgress());
  const [showSessionGoal, setShowSessionGoal] = useState(false);
  const [sessionGoalDismissed, setSessionGoalDismissed] = useState(false);
  const [xpToast, setXpToast] = useState<string | null>(null);
  const [discoveryToast, setDiscoveryToast] = useState<string | null>(null);

  // Phase 4: Hint escalation, phase transitions, highlights
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [phaseTransition, setPhaseTransition] = useState<string | null>(null);
  const [highlightedFractions, setHighlightedFractions] = useState<string[]>([]);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Phase 4b: AI-suggested challenge mode switch
  const [suggestedMode, setSuggestedMode] = useState<string | null>(null);

  // Game event queue — only send to AI when not loading, max 1 per 1.5s
  const gameEventQueue = useRef<string | null>(null);
  const gameEventTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingRef = useRef(false);

  // Voice character
  const [voiceCharacter, setVoiceCharacter] = useState<VoiceCharacter>(() => loadSelectedCharacter());

  // Mission / challenge system
  const [currentMission, setCurrentMission] = useState<Challenge | null>(null);
  const [missionSolved, setMissionSolved] = useState(false);

  // Phase 5: Mute toggle
  const [soundMuted, setSoundMuted] = useState(false);
  const [bgMusicMuted, setBgMusicMuted] = useState(true);

  // Load persistent data on mount
  useEffect(() => {
    setTrophies(loadTrophies());
    setEarnedBadges(loadEarnedBadges());
    setSoundMuted(isMuted());
    setBgMusicMuted(isMusicMuted());
    // Start first mission
    setCurrentMission(generateChallenge(loadProgress().level));
  }, []);

  // Start/stop background music based on toggle
  useEffect(() => {
    if (!bgMusicMuted) {
      startMusic();
    } else {
      stopMusic();
    }
    return () => stopMusic();
  }, [bgMusicMuted]);

  // Restore session after mount (avoids hydration mismatch)
  // Only restore early phases — late phases (assessment/celebration) cause the AI
  // to immediately advance to completion on the greeting response.
  const RESTORABLE_PHASES = new Set(["intro", "exploration", "discovery", "practice"]);
  const hasRestoredSession = useRef(false);
  const didRestoreSession = useRef(false);
  useEffect(() => {
    if (hasRestoredSession.current) return;
    hasRestoredSession.current = true;
    const saved = loadSession();
    if (saved && RESTORABLE_PHASES.has(saved.lessonState.phase)) {
      setLessonState(saved.lessonState);
      setMatchHistory(saved.matchHistory);
      didRestoreSession.current = true;
    } else if (saved) {
      // Clear stale completed/late session
      clearSession();
    }
  }, []);

  // Persist lesson state on changes
  useEffect(() => {
    saveSession({ lessonState, matchHistory });
  }, [lessonState, matchHistory]);

  // Build workspace state sent with every API call
  const buildWorkspaceBody = useCallback(() => ({
    workspaceState: {
      comparisonLeft: comparisonLeft ? fractionToString(comparisonLeft) : null,
      comparisonRight: comparisonRight ? fractionToString(comparisonRight) : null,
      lessonStep: lessonState.step,
      totalSteps: lessonState.totalSteps,
      lessonPhase: lessonState.phase,
      completedChallenges: lessonState.completedChallenges,
      matchHistory,
      consecutiveFailures,
      playerLevel: playerProgress.level,
      dailyXP: playerProgress.dailyXP,
      dailyGoal: playerProgress.dailyGoal,
    },
  }), [comparisonLeft, comparisonRight, lessonState, matchHistory, consecutiveFailures, playerProgress]);

  const { messages, append, setMessages, isLoading } = useChat({
    api: "/api/tutor",
    body: buildWorkspaceBody(),
    onError: (error) => {
      setApiError(
        error.message?.includes("API key")
          ? "No AI provider configured. Add an API key to .env.local and restart."
          : "Could not reach the AI tutor. Check your connection and try again."
      );
    },
  });

  // Sync loading state to ref for use in closures
  isLoadingRef.current = isLoading;

  // Parse highlighted fractions from assistant messages
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant" && !isLoading) {
      const matches = lastMsg.content.match(/\[(\d+\/\d+)\]/g);
      if (matches) {
        const fracs = matches.map((m) => m.slice(1, -1));
        setHighlightedFractions(fracs);
        if (highlightTimer.current) clearTimeout(highlightTimer.current);
        highlightTimer.current = setTimeout(() => setHighlightedFractions([]), 10000);
      }
    }
  }, [messages, isLoading]);

  // AI-driven phase advancement: detect [ADVANCE_PHASE] in tutor responses
  // Guard: ignore ADVANCE_PHASE in the very first assistant message (the greeting) —
  // this prevents stale context from causing instant lesson completion.
  const advancePhaseCount = useRef(0);
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant" && lastMsg.content.includes("[ADVANCE_PHASE]")) {
      // Remove the tag from displayed message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === lastMsg.id
            ? { ...m, content: m.content.replace(/\s*\[ADVANCE_PHASE\]\s*/g, "").trim() }
            : m
        )
      );

      // Count assistant messages — skip if this is the first one (greeting)
      const assistantCount = messages.filter((m) => m.role === "assistant").length;
      if (assistantCount <= 1) return;

      advancePhaseCount.current++;

      // Show phase transition card then advance
      setLessonState((prev) => {
        const next = advanceLesson(prev);
        if (next.phase !== prev.phase && next.phase !== "celebration") {
          setPhaseTransition(next.phase);
        }
        if (next.phase === "celebration") {
          setTimeout(() => setShowCompletion(true), 1500);
        }
        return next;
      });
    }
  }, [messages, setMessages]);

  // AI-driven mode switch: detect [SWITCH_MODE:xxx] in tutor responses
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant" && /\[SWITCH_MODE:\w+\]/.test(lastMsg.content)) {
      const match = lastMsg.content.match(/\[SWITCH_MODE:(\w+)\]/);
      if (match) {
        const mode = match[1];
        setMessages((prev) =>
          prev.map((m) =>
            m.id === lastMsg.id
              ? { ...m, content: m.content.replace(/\s*\[SWITCH_MODE:\w+\]\s*/g, "").trim() }
              : m
          )
        );
        setSuggestedMode(mode);
      }
    }
  }, [messages, setMessages]);

  // Show onboarding after AI greeting loads (first visit only)
  useEffect(() => {
    if (onboardingChecked.current) return;
    if (messages.length > 0 && messages.some((m) => m.role === "assistant")) {
      onboardingChecked.current = true;
      try {
        if (!localStorage.getItem("onboarding-seen")) {
          setShowOnboarding(true);
        }
      } catch {
        // ignore
      }
    }
  }, [messages]);

  // Send initial greeting with proper cleanup
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    abortRef.current = new AbortController();

    // If we restored a mid-session, tell the AI we're resuming (not starting fresh)
    // so it doesn't immediately try to advance phases.
    const content = didRestoreSession.current
      ? "[Student has resumed the lesson — continue where they left off. Do NOT advance the phase yet.]"
      : "[Student has joined the lesson]";

    append({
      role: "user",
      content,
    });

    return () => {
      abortRef.current?.abort();
    };
  }, [append]);

  // Track last tutor message for voice narration
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (lastAssistant && lastAssistant.content !== lastTutorMessage && !isLoading) {
      setLastTutorMessage(lastAssistant.content);
    }
  }, [messages, isLoading, lastTutorMessage]);

  // XP reward helper — awards XP, updates progress state, shows toast, handles level-ups
  const awardXP = useCallback((amount: number, label: string) => {
    const result: XPResult = addXP(amount);
    setPlayerProgress(result.progress);

    // XP toast
    setXpToast(`+${amount} XP — ${label}`);
    setTimeout(() => setXpToast(null), 2000);

    // Level-up announcement
    if (result.leveledUp) {
      // Send to Frax
      append({
        role: "user",
        content: `[Student just leveled up to Level ${result.newLevel}! Celebrate enthusiastically!]`,
      });
    }

    // Newly unlocked modes
    if (result.newlyUnlockedModes.length > 0) {
      const modeNames = result.newlyUnlockedModes.join(", ");
      append({
        role: "user",
        content: `[Student just unlocked new mode(s): ${modeNames}! Congratulate them and suggest trying it!]`,
      });
    }

    // Daily goal reached
    if (result.dailyGoalReached && !sessionGoalDismissed) {
      setTimeout(() => setShowSessionGoal(true), 1500);
    }
  }, [append, sessionGoalDismissed]);

  // Badge check helper
  const checkBadges = useCallback((stats: StudentStats) => {
    const newBadges = checkNewBadges(stats, earnedBadges);
    if (newBadges.length > 0) {
      setEarnedBadges((prev) => [...prev, ...newBadges]);
      // Show toast for first new badge
      const badge = BADGE_DEFINITIONS.find((b) => b.id === newBadges[0]);
      if (badge) {
        setBadgeToast(`${badge.emoji} ${badge.name}!`);
        setTimeout(() => setBadgeToast(null), 3000);
      }
    }
  }, [earnedBadges]);

  const handleSend = useCallback(
    (message: string) => {
      setApiError(null);
      // Clear highlights on user interaction
      setHighlightedFractions([]);
      append({ role: "user", content: message });
    },
    [append]
  );

  const handleComparisonChange = useCallback(
    (left: FractionData | null, right: FractionData | null) => {
      setComparisonLeft(left);
      setComparisonRight(right);
      // Clear highlights on interaction
      setHighlightedFractions([]);

      // Notify AI of workspace change — include equality result so AI doesn't hallucinate
      const leftStr = left ? fractionToString(left) : "empty";
      const rightStr = right ? fractionToString(right) : "empty";

      if (left && right) {
        const equal = areFractionsEqual(left, right);
        append({
          role: "user",
          content: `[Student updated comparison zone: Left=${leftStr}, Right=${rightStr}. Result: these fractions ARE ${equal ? "EQUAL" : "NOT equal"}. ${equal ? `Both simplify to the same value.` : ""}]`,
        });
      } else if (left || right) {
        append({
          role: "user",
          content: `[Student updated comparison zone: Left=${leftStr}, Right=${rightStr}]`,
        });
      }
    },
    [append]
  );

  const handleMatch = useCallback(
    (isEqual: boolean) => {
      // Record the match attempt
      if (comparisonLeft && comparisonRight) {
        const record: MatchRecord = {
          left: fractionToString(comparisonLeft),
          right: fractionToString(comparisonRight),
          equal: isEqual,
        };
        setMatchHistory((prev) => [...prev, record]);
      }

      if (isEqual) {
        setShowCelebration(true);
        setLessonState((prev) => ({
          ...prev,
          completedChallenges: prev.completedChallenges + 1,
        }));

        // Update streak
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > 0 && newStreak % 3 === 0) {
          playStreakMilestone();
          awardXP(2, "Streak!");
        }

        // Save trophy + check discovery
        if (comparisonLeft && comparisonRight) {
          const leftStr = fractionToString(comparisonLeft);
          const rightStr = fractionToString(comparisonRight);
          const updated = saveTrophy(leftStr, rightStr);
          setTrophies(updated);

          // Discovery check — is this a NEW equivalence?
          const discoveryKey = [leftStr, rightStr].sort().join("=");
          const isNewDiscovery = recordDiscovery(discoveryKey);
          if (isNewDiscovery) {
            awardXP(5, "New Discovery!");
            setDiscoveryToast(`✨ New Discovery: ${leftStr} = ${rightStr}!`);
            setTimeout(() => setDiscoveryToast(null), 3000);
            append({
              role: "user",
              content: `[Student discovered a NEW equivalence: ${leftStr} = ${rightStr}! This is exciting — celebrate this discovery!]`,
            });
          } else {
            awardXP(2, "Match!");
          }

          incrementStat("lifetimeMatches");

          // Update stats and check badges
          const newStats: StudentStats = {
            ...studentStats,
            matches: studentStats.matches + 1,
            streak: newStreak,
            uniquePairs: updated.length,
          };
          setStudentStats(newStats);
          checkBadges(newStats);
        }

        // Check mission completion
        if (currentMission && comparisonLeft && comparisonRight) {
          const leftFrac = { numerator: comparisonLeft.numerator, denominator: comparisonLeft.denominator };
          const rightFrac = { numerator: comparisonRight.numerator, denominator: comparisonRight.denominator };
          if (
            currentMission.type === "find-equivalent" &&
            currentMission.targetFraction &&
            (checkAnswer(currentMission, leftFrac) || checkAnswer(currentMission, rightFrac))
          ) {
            setMissionSolved(true);
            awardXP(currentMission.xpReward, "Mission complete!");
            // Generate next mission after a beat
            setTimeout(() => {
              setMissionSolved(false);
              setCurrentMission(generateChallenge(playerProgress.level));
            }, 2500);
          } else if (currentMission.type === "share-puzzle") {
            if (checkAnswer(currentMission, leftFrac) || checkAnswer(currentMission, rightFrac)) {
              setMissionSolved(true);
              awardXP(currentMission.xpReward, "Mission complete!");
              setTimeout(() => {
                setMissionSolved(false);
                setCurrentMission(generateChallenge(playerProgress.level));
              }, 2500);
            }
          }
        }

        // Reset consecutive failures
        setConsecutiveFailures(0);
      } else {
        // Wrong match — show Swiper feedback
        setShowSwiper(true);
        setStreak(0);
        const newFailures = consecutiveFailures + 1;
        setConsecutiveFailures(newFailures);

        // Auto-hint at 2 and 4 failures
        if (newFailures === 2) {
          append({
            role: "user",
            content: `[Student has made ${newFailures} incorrect attempts. Offer a gentle hint.]`,
          });
        } else if (newFailures === 4) {
          append({
            role: "user",
            content: `[Student has made ${newFailures} incorrect attempts. Suggest a specific pair like "Try [1/2] and [2/4]".]`,
          });
        }
      }
    },
    [comparisonLeft, comparisonRight, streak, studentStats, checkBadges, consecutiveFailures, append, awardXP, currentMission, playerProgress.level]
  );

  const handleSmashAction = useCallback(() => {
    const newStats = { ...studentStats, smashes: studentStats.smashes + 1 };
    setStudentStats(newStats);
    checkBadges(newStats);
    incrementStat("lifetimeSmashes");
    // Unlock extra fractions every 3 smashes+merges
    const totalActions = newStats.smashes + newStats.merges;
    if (totalActions > 0 && totalActions % 3 === 0) {
      setMasteryLevel((prev) => {
        const next = prev + 1;
        persistMastery(next);
        return next;
      });
    }
  }, [studentStats, checkBadges]);

  const handleMergeAction = useCallback(() => {
    const newStats = { ...studentStats, merges: studentStats.merges + 1 };
    setStudentStats(newStats);
    checkBadges(newStats);
    incrementStat("lifetimeMerges");
    // Unlock extra fractions every 3 smashes+merges
    const totalActions = newStats.smashes + newStats.merges;
    if (totalActions > 0 && totalActions % 3 === 0) {
      setMasteryLevel((prev) => {
        const next = prev + 1;
        persistMastery(next);
        return next;
      });
    }
  }, [studentStats, checkBadges]);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    try {
      localStorage.setItem("onboarding-seen", "1");
    } catch {
      // ignore
    }
  }, []);

  const handleMuteToggle = useCallback(() => {
    const newMuted = !soundMuted;
    setSoundMuted(newMuted);
    setMuted(newMuted);
    // Also mute music
    setBgMusicMuted(newMuted);
    setMusicMuted(newMuted);
    // Also mute voice
    if (newMuted) {
      setVoiceEnabled(false);
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } else {
      setVoiceEnabled(true);
    }
  }, [soundMuted]);

  const handleRestart = useCallback(() => {
    setLessonState(INITIAL_LESSON_STATE);
    setComparisonLeft(null);
    setComparisonRight(null);
    setMatchHistory([]);
    setShowCompletion(false);
    setApiError(null);
    setMessages([]);
    setStreak(0);
    setConsecutiveFailures(0);
    setHighlightedFractions([]);
    setPhaseTransition(null);
    setStudentStats({ matches: 0, smashes: 0, merges: 0, streak: 0, uniquePairs: trophies.length });
    setMasteryLevel(0);
    clearSession();
    hasInitialized.current = false;
    // Re-trigger initialization
    setTimeout(() => {
      hasInitialized.current = true;
      append({ role: "user", content: "[Student has restarted the lesson]" });
    }, 100);
  }, [append, setMessages, trophies.length]);

  // Quick replies — big tappable buttons, context-aware (mission + phase)
  const getQuickReplies = () => {
    // Mission-aware replies
    if (currentMission && !missionSolved) {
      switch (currentMission.type) {
        case "find-equivalent":
          return ["I found it!", "Give me a clue!", "What does equal mean?"];
        case "compare-bigger":
          return ["This one is bigger!", "Help me!", "Show me!"];
        case "share-puzzle":
          return ["I know!", "Help me!", "What do I drag?"];
        case "missing-number":
          return ["I see it!", "Give me a clue!", "I'm stuck"];
      }
    }

    // Dora-style call-and-response quick replies
    switch (lessonState.phase) {
      case "intro":
        return ["Vamonos!", "I'm ready!", "What are fractions?"];
      case "exploration":
        return ["I did it!", "Show me!", "Help me!"];
      case "discovery":
        return ["They're twins!", "Whoa cool!", "More!"];
      case "practice":
        return ["Found one!", "Hint please!", "We did it!"];
      case "assessment":
        return ["I found it!", "So close!", "Help!"];
      case "celebration":
        return ["WE DID IT!", "Again!", "That was awesome!"];
      default:
        return [];
    }
  };

  // Filter system messages from display
  const visibleMessages = messages.filter(
    (m) => !m.content.startsWith("[Student") && !m.content.startsWith("[")
  );

  return (
    <div className="h-dvh flex flex-col bg-surface">
      {/* Top bar — Dora adventure style */}
      <div className="flex items-center justify-between px-2.5 py-1 sm:py-1.5 bg-gradient-to-r from-sky-100/80 via-amber-50 to-emerald-50/80 border-b border-amber-200/60">
        <div className="flex items-center gap-1.5">
          <a
            href="/"
            className="text-sm text-amber-500 active:text-amber-700 px-1"
          >
            ←
          </a>
          <button
            onClick={() => setShowMap(true)}
            className="px-2.5 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black rounded-full shadow-sm active:scale-95 transition-transform"
          >
            🗺️ MAP!
          </button>
          <StreakCounter streak={streak} />
        </div>

        <div className="flex items-center gap-1">
          <VoiceNarrator
            text={lastTutorMessage}
            enabled={voiceEnabled}
            onToggle={() => setVoiceEnabled(!voiceEnabled)}
            onSpeakingChange={setIsSpeaking}
            character={voiceCharacter}
          />
          <button
            onClick={handleMuteToggle}
            className="text-xs px-1.5 py-1"
          >
            {soundMuted ? "🔇" : "🔊"}
          </button>
          <TrophyWall trophies={trophies} />
        </div>
      </div>

      {/* Progress + XP + Mission — compact strip, collapses in landscape */}
      <div className="landscape-thin flex items-center gap-2 px-3 py-0.5">
        <div className="flex-1 min-w-0">
          <ProgressTracker
            currentStep={lessonState.step}
            totalSteps={lessonState.totalSteps}
            phase={lessonState.phase}
          />
        </div>
      </div>
      <div className="landscape-hide px-3 py-0.5">
        <XPBar
          xp={playerProgress.xp}
          level={playerProgress.level}
          dailyXP={playerProgress.dailyXP}
          dailyGoal={playerProgress.dailyGoal}
        />
      </div>

      {/* Active mission — hidden in landscape to save space */}
      <div className="px-3 py-0.5 landscape-hide">
        <MissionCard
          challenge={currentMission}
          solved={missionSolved}
          onSkip={() => {
            setMissionSolved(false);
            setCurrentMission(generateChallenge(playerProgress.level));
          }}
        />
      </div>

      {/* API error banner */}
      {apiError && (
        <div className="mx-4 mt-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700 flex items-center justify-between">
          <span>{apiError}</span>
          <button
            onClick={() => setApiError(null)}
            className="ml-3 text-orange-500 hover:text-orange-700 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Main content — responsive split layout (side-by-side on iPad+) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Chat panel — 30% width on tablet+, or stacked in portrait phone */}
        <div className="min-h-0 md:w-[30%] md:min-w-[260px] md:max-w-[340px] md:border-r border-amber-100/60 flex flex-col max-h-[35vh] md:max-h-none">
          <ChatPanel
            messages={visibleMessages}
            isLoading={isLoading}
            onSend={handleSend}
            quickReplies={getQuickReplies()}
            isSpeaking={isSpeaking}
            characterId={voiceCharacter.id}
            characterName={voiceCharacter.name}
          />
        </div>

        {/* Fraction workspace — takes majority of space on tablet, rest of space on phone */}
        <div className="flex-1 min-h-0 p-1 sm:p-1.5 md:p-2">
          <FractionWorkspace
            comparisonLeft={comparisonLeft}
            comparisonRight={comparisonRight}
            onComparisonChange={handleComparisonChange}
            onMatch={handleMatch}
            onSmashAction={handleSmashAction}
            onMergeAction={handleMergeAction}
            highlightedFractions={highlightedFractions}
            suggestedMode={suggestedMode}
            onModeSwitched={() => setSuggestedMode(null)}
            masteryLevel={masteryLevel}
            unlockedModes={playerProgress.unlockedModes}
            playerLevel={playerProgress.level}
            onXP={awardXP}
            onGameEvent={(event) => {
              // Queue the event — latest wins, send only when AI is idle
              gameEventQueue.current = event;
              if (gameEventTimer.current) clearTimeout(gameEventTimer.current);
              gameEventTimer.current = setTimeout(() => {
                const queued = gameEventQueue.current;
                if (queued && !isLoadingRef.current) {
                  gameEventQueue.current = null;
                  append({ role: "user", content: queued });
                }
              }, 1500);
            }}
          />
        </div>
      </div>

      {/* Celebration overlay */}
      <Celebration
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Wrong-answer "Swiper" feedback */}
      <SwiperFeedback
        show={showSwiper}
        onComplete={() => setShowSwiper(false)}
      />

      {/* Adventure Map overlay */}
      <FractionMap
        show={showMap}
        currentPhase={lessonState.phase}
        completedChallenges={lessonState.completedChallenges}
        onClose={() => setShowMap(false)}
        characterId={voiceCharacter.id}
      />

      {/* Completion screen */}
      <CompletionScreen
        show={showCompletion}
        challengesCompleted={lessonState.completedChallenges}
        trophyCount={trophies.length}
        earnedBadges={earnedBadges}
        onRestart={handleRestart}
        onHome={() => router.push("/")}
      />

      {/* Onboarding overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingOverlay onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>

      {/* Phase transition card */}
      <AnimatePresence>
        {phaseTransition && (
          <PhaseTransitionCard
            phase={phaseTransition}
            matchCount={lessonState.completedChallenges}
            onDismiss={() => setPhaseTransition(null)}
          />
        )}
      </AnimatePresence>

      {/* Badge toast */}
      <AnimatePresence>
        {badgeToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-6 left-1/2 z-50 px-5 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg text-sm"
          >
            {badgeToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* XP toast */}
      <AnimatePresence>
        {xpToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed bottom-14 left-1/2 z-50 px-4 py-2 bg-indigo-500 text-white font-bold rounded-lg shadow-lg text-xs"
          >
            {xpToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discovery toast */}
      <AnimatePresence>
        {discoveryToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.8, x: "-50%" }}
            className="fixed bottom-24 left-1/2 z-50 px-5 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold rounded-xl shadow-lg text-sm"
          >
            {discoveryToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session goal overlay */}
      <AnimatePresence>
        {showSessionGoal && (
          <SessionGoalCard
            xp={playerProgress.xp}
            level={playerProgress.level}
            dailyXP={playerProgress.dailyXP}
            consecutiveDays={playerProgress.consecutiveDays}
            onKeepGoing={() => {
              setShowSessionGoal(false);
              setSessionGoalDismissed(true);
            }}
            onDoneForToday={() => router.push("/")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
