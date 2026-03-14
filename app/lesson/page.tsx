"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useChat } from "ai/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ChatPanel from "@/components/chat/ChatPanel";
import FractionWorkspace from "@/components/manipulative/FractionWorkspace";
import Celebration from "@/components/feedback/Celebration";
import SwiperFeedback from "@/components/feedback/SwiperFeedback";
import SwiperChallenge from "@/components/feedback/SwiperChallenge";
import CompletionScreen from "@/components/feedback/CompletionScreen";
import VoiceNarrator from "@/components/voice/VoiceNarrator";
import OnboardingOverlay from "@/components/manipulative/OnboardingOverlay";
import TrophyWall from "@/components/feedback/TrophyWall";
import StreakCounter from "@/components/feedback/StreakCounter";
import PhaseTransitionCard from "@/components/feedback/PhaseTransitionCard";
import FractionMap from "@/components/feedback/FractionMap";
import EpisodeSelect from "@/components/EpisodeSelect";
import JourneyStrip from "@/components/JourneyStrip";
import { type FractionData, fractionToString } from "@/lib/fractions";
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
import { loadSelectedCharacter, type VoiceCharacter } from "@/lib/voice-characters";
import { generateChallengeWithReview, checkAnswer, type Challenge } from "@/lib/challenges";
import { useStudent } from "@/lib/student-context";
import { CURRICULUM, type Episode } from "@/lib/curriculum";
import { loadMastery, recordAttempt, completeEpisode, getNextEpisode } from "@/lib/mastery";
import { getMisconceptionContext } from "@/lib/misconceptions";
import EpisodePlayer from "@/components/manipulative/EpisodePlayer";

interface MatchRecord {
  left: string;
  right: string;
  equal: boolean;
}

// Session persistence — scoped per student
import { getActiveStudentId } from "@/lib/active-student-id";

const SESSION_BASE_KEY = "synthesis-tutor-session";

function sessionKey(): string {
  const sid = getActiveStudentId();
  return sid ? `${SESSION_BASE_KEY}:${sid}` : SESSION_BASE_KEY;
}

function saveSession(state: {
  lessonState: LessonState;
  matchHistory: MatchRecord[];
  episodeId?: number;
}) {
  try {
    sessionStorage.setItem(sessionKey(), JSON.stringify(state));
  } catch {
    // Storage unavailable — ignore
  }
}

function loadSession(): {
  lessonState: LessonState;
  matchHistory: MatchRecord[];
  episodeId?: number;
} | null {
  try {
    const raw = sessionStorage.getItem(sessionKey());
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(sessionKey());
  } catch {
    // ignore
  }
}

export default function LessonPage() {
  const router = useRouter();
  const { student, difficulty, syncProgress } = useStudent();
  const [lessonState, setLessonState] = useState<LessonState>(INITIAL_LESSON_STATE);
  const [comparisonLeft, setComparisonLeft] = useState<FractionData | null>(null);
  const [comparisonRight, setComparisonRight] = useState<FractionData | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showSwiper, setShowSwiper] = useState(false);
  const [showSwiperChallenge, setShowSwiperChallenge] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Voice-first for kids
  const [lastTutorMessage, setLastTutorMessage] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const hasInitialized = useRef(false);
  const [restartKey, setRestartKey] = useState(0);
  const restartContentRef = useRef<string | null>(null);

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

  // Game event queue — batch system events, only send to AI when not loading
  const gameEventQueue = useRef<string | null>(null);
  const gameEventTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingRef = useRef(false);

  // System event batcher — collects rapid-fire system events and sends as ONE message
  const systemEventBuffer = useRef<string[]>([]);
  const systemEventTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Voice character
  const [voiceCharacter, setVoiceCharacter] = useState<VoiceCharacter>(() => loadSelectedCharacter());

  // Mission / challenge system
  const [currentMission, setCurrentMission] = useState<Challenge | null>(null);
  const [missionSolved, setMissionSolved] = useState(false);

  // Episode-based flow
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

  // Teaching intro — for early episodes, show only chat (no workspace) while AI teaches what fractions are
  const [teachingIntro, setTeachingIntro] = useState(false);

  // Episode mode: true = structured curriculum (EpisodePlayer), false = free-play workspace
  const [episodeMode, setEpisodeMode] = useState(true);
  const [currentMissionPrompt, setCurrentMissionPrompt] = useState("");

  // Journey strip — map lesson phase to stop index
  const PHASE_TO_JOURNEY: Record<string, number> = {
    intro: 0, exploration: 1, discovery: 2, practice: 3, assessment: 4, celebration: 5,
  };
  const journeyIndex = PHASE_TO_JOURNEY[lessonState.phase] ?? 0;

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
    setCurrentMission(generateChallengeWithReview(loadProgress().level, difficulty, Object.values(loadMastery().skills).filter(s => s.status === "mastered").map(s => s.skill)));
  }, []);

  // Cleanup all timer refs on unmount
  useEffect(() => {
    return () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      if (gameEventTimer.current) clearTimeout(gameEventTimer.current);
      if (systemEventTimer.current) clearTimeout(systemEventTimer.current);
    };
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
      // Restore episode selection from session
      if (saved.episodeId) {
        const ep = CURRICULUM.find((e) => e.id === saved.episodeId);
        if (ep) setSelectedEpisode(ep);
      }
      didRestoreSession.current = true;
    } else if (saved) {
      // Clear stale completed/late session
      clearSession();
    }
  }, []);

  // Persist lesson state on changes
  useEffect(() => {
    saveSession({ lessonState, matchHistory, episodeId: selectedEpisode?.id });
  }, [lessonState, matchHistory]);

  // Build workspace state sent with every API call — useMemo so body updates reactively
  const workspaceBody = useMemo(() => ({
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
      difficulty,
      studentName: student?.name,
      misconceptionContext: getMisconceptionContext() || undefined,
      episodeMode: episodeMode && !!selectedEpisode,
      currentMissionPrompt: episodeMode && selectedEpisode ? currentMissionPrompt : undefined,
      currentEpisode: selectedEpisode ? {
        id: selectedEpisode.id,
        title: selectedEpisode.title,
        skills: selectedEpisode.skills,
        missionIndex: lessonState.step - 1,
        totalMissions: selectedEpisode.missions.length,
      } : undefined,
    },
  }), [comparisonLeft, comparisonRight, lessonState, matchHistory, consecutiveFailures, playerProgress, difficulty, student, selectedEpisode, episodeMode, currentMissionPrompt]);

  const { messages, append, setMessages, isLoading } = useChat({
    api: "/api/tutor",
    body: workspaceBody,
    onError: (error) => {
      setApiError(
        error.message?.includes("API key")
          ? "Oops! Your buddy needs a little setup. Ask a grown-up to check the settings!"
          : "Hmm, lost the connection! Check your wifi and try again."
      );
    },
  });

  // ── Stable refs for `append` and `setMessages` ──
  // useChat returns a new `append` identity on every `messages` change.
  // If we put `append` directly into useCallback deps, it cascades through
  // EVERY handler → causing infinite re-renders that freeze the iPad.
  // Using a ref breaks this chain while always calling the latest version.
  const appendRef = useRef(append);
  appendRef.current = append;
  const setMessagesRef = useRef(setMessages);
  setMessagesRef.current = setMessages;

  const stableAppend = useCallback(
    (...args: Parameters<typeof append>) => appendRef.current(...args),
    []
  );
  const stableSetMessages = useCallback(
    (...args: Parameters<typeof setMessages>) => setMessagesRef.current(...args),
    []
  );

  // Sync loading state to ref for use in closures
  isLoadingRef.current = isLoading;

  // Batch system events into a single AI message to prevent voice overlap
  // Multiple events within 600ms get combined into one prompt
  const flushSystemEvents = useCallback(() => {
    if (systemEventBuffer.current.length === 0) return;
    const combined = systemEventBuffer.current.join(" ");
    systemEventBuffer.current = [];
    stableAppend({ role: "user", content: combined });
  }, [stableAppend]);

  const batchSystemEvent = useCallback((event: string) => {
    systemEventBuffer.current.push(event);
    if (systemEventTimer.current) clearTimeout(systemEventTimer.current);
    systemEventTimer.current = setTimeout(flushSystemEvents, 600);
  }, [flushSystemEvents]);

  // Parse highlighted fractions from assistant messages
  const lastParsedMsgId = useRef<string | null>(null);
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant" || isLoading) return;
    if (lastMsg.id === lastParsedMsgId.current) return; // already parsed this message
    lastParsedMsgId.current = lastMsg.id;

    const matches = lastMsg.content.match(/\[(\d+\/\d+)\]/g);
    if (matches) {
      const fracs = matches.map((m) => m.slice(1, -1));
      setHighlightedFractions(fracs);
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(() => setHighlightedFractions([]), 10000);
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
      stableSetMessages((prev) =>
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

      // End teaching intro when moving past intro phase
      setTeachingIntro(false);

      // Show phase transition card then advance
      setLessonState((prev) => {
        const next = advanceLesson(prev);
        if (next.phase !== prev.phase && next.phase !== "celebration") {
          setPhaseTransition(next.phase);
        }
        if (next.phase === "celebration") {
          // Mark episode as completed in mastery system
          if (selectedEpisode) {
            completeEpisode(selectedEpisode.id);
          }
          setTimeout(() => setShowCompletion(true), 1500);
        }
        return next;
      });
    }
  }, [messages, stableSetMessages]);

  // AI-driven mode switch: detect [SWITCH_MODE:xxx] in tutor responses
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant" && /\[SWITCH_MODE:\w+\]/.test(lastMsg.content)) {
      const match = lastMsg.content.match(/\[SWITCH_MODE:(\w+)\]/);
      if (match) {
        const mode = match[1];
        stableSetMessages((prev) =>
          prev.map((m) =>
            m.id === lastMsg.id
              ? { ...m, content: m.content.replace(/\s*\[SWITCH_MODE:\w+\]\s*/g, "").trim() }
              : m
          )
        );
        setSuggestedMode(mode);
      }
    }
  }, [messages, stableSetMessages]);

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

  // Send initial greeting with proper cleanup.
  // Waits for episode selection (or a restored session) before initializing the AI.
  useEffect(() => {
    if (!selectedEpisode && !didRestoreSession.current) return;
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    abortRef.current = new AbortController();

    // On restart, use the content set by the restart handler
    let content = restartContentRef.current;
    restartContentRef.current = null;

    if (!content) {
      if (didRestoreSession.current) {
        content = "[Student has resumed the lesson — continue where they left off. Do NOT advance the phase yet.]";
      } else if (selectedEpisode) {
        if (selectedEpisode.id <= 2) {
          // Early episodes: teach the concept FIRST before any tasks
          content = `[New student, Episode 1. Say hi and ask: "Imagine you have one big cookie — the WHOLE thing. What would you do if your friend wanted some?" Nothing else. No fractions. No numbers. Just that question.]`;
        } else {
          content = `[Student started Episode ${selectedEpisode.id}: "${selectedEpisode.title}". Skills: ${selectedEpisode.skills.join(", ")}. Begin with the warmup!]`;
        }
      } else {
        content = "[Student has joined the lesson]";
      }
    }

    stableAppend({
      role: "user",
      content,
    });

    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableAppend, restartKey, selectedEpisode]);

  // Track last tutor message for voice narration
  const lastTutorRef = useRef(lastTutorMessage);
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (lastAssistant && lastAssistant.content !== lastTutorRef.current && !isLoading) {
      lastTutorRef.current = lastAssistant.content;
      setLastTutorMessage(lastAssistant.content);
    }
  }, [messages, isLoading]);

  // XP reward helper — awards XP, updates progress state, shows toast, handles level-ups
  const awardXP = useCallback((amount: number, label: string) => {
    const result: XPResult = addXP(amount);
    setPlayerProgress(result.progress);
    syncProgress();

    // XP toast
    setXpToast(`+${amount} XP! ${label}`);
    setTimeout(() => setXpToast(null), 2000);

    // Level-up announcement
    if (result.leveledUp) {
      batchSystemEvent(`[LEVEL UP! Student just reached Level ${result.newLevel}! React like something amazing just happened — gasp, get excited, make them feel like a superstar!]`);
    }

    // Newly unlocked modes
    if (result.newlyUnlockedModes.length > 0) {
      const modeNames = result.newlyUnlockedModes.join(", ");
      batchSystemEvent(`[Student just unlocked: ${modeNames}. Casually mention it — "oh hey, you unlocked something new!"]`);
    }

    // Daily goal reached
    if (result.dailyGoalReached && !sessionGoalDismissed) {
      setTimeout(() => setShowSessionGoal(true), 1500);
    }
  }, [batchSystemEvent, sessionGoalDismissed]);

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
      stableAppend({ role: "user", content: message });
    },
    [stableAppend]
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

      // Only notify AI when ONE side is filled (the match handler covers both-filled case)
      if ((left && !right) || (!left && right)) {
        batchSystemEvent(`[Student updated comparison zone: Left=${leftStr}, Right=${rightStr}]`);
      }
    },
    [batchSystemEvent]
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
        setLessonState((prev) => {
          const newChallenges = prev.completedChallenges + 1;
          // Auto-advance journey based on milestones
          const PHASE_THRESHOLDS: Record<string, number> = {
            intro: 1,        // 1 match → Forest
            exploration: 3,  // 3 matches → Cave
            discovery: 5,    // 5 matches → Mountain
            practice: 8,     // 8 matches → Castle
            assessment: 12,  // 12 matches → Victory!
          };
          const threshold = PHASE_THRESHOLDS[prev.phase];
          if (threshold && newChallenges >= threshold) {
            const next = advanceLesson({ ...prev, completedChallenges: newChallenges });
            setPhaseTransition(next.phase);
            batchSystemEvent(`[Student reached ${newChallenges} matches and advanced to the ${next.phase} phase! Celebrate and introduce the new area!]`);
            return next;
          }
          return { ...prev, completedChallenges: newChallenges };
        });

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
            setDiscoveryToast(`✨ Whoa! ${leftStr} and ${rightStr} are secretly the same!`);
            setTimeout(() => setDiscoveryToast(null), 3000);
            batchSystemEvent(`[Student discovered a NEW equivalence: ${leftStr} = ${rightStr}! Celebrate!]`);
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
        if (currentMission && !missionSolved && comparisonLeft && comparisonRight) {
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
              setCurrentMission(generateChallengeWithReview(playerProgress.level, difficulty, Object.values(loadMastery().skills).filter(s => s.status === "mastered").map(s => s.skill)));
            }, 2500);
          } else if (currentMission.type === "share-puzzle") {
            if (checkAnswer(currentMission, leftFrac) || checkAnswer(currentMission, rightFrac)) {
              setMissionSolved(true);
              awardXP(currentMission.xpReward, "Mission complete!");
              setTimeout(() => {
                setMissionSolved(false);
                setCurrentMission(generateChallengeWithReview(playerProgress.level, difficulty, Object.values(loadMastery().skills).filter(s => s.status === "mastered").map(s => s.skill)));
              }, 2500);
            }
          }
        }

        // Reset consecutive failures
        setConsecutiveFailures(0);
      } else {
        // Wrong match — show feedback
        setStreak(0);
        const newFailures = consecutiveFailures + 1;
        setConsecutiveFailures(newFailures);

        // After 2+ consecutive failures, 25% chance of Swiper challenge
        if (newFailures >= 2 && Math.random() < 0.25) {
          setShowSwiperChallenge(true);
        } else {
          setShowSwiper(true);
        }

        // Auto-hint at 2 and 4 failures
        if (newFailures === 2) {
          batchSystemEvent(`[Student has made ${newFailures} incorrect attempts. Offer a gentle hint.]`);
        } else if (newFailures === 4) {
          batchSystemEvent(`[Student has made ${newFailures} incorrect attempts. Suggest a specific pair like "Try [1/2] and [2/4]".]`);
        }
      }
    },
    [comparisonLeft, comparisonRight, streak, studentStats, checkBadges, consecutiveFailures, batchSystemEvent, awardXP, currentMission, missionSolved, playerProgress.level, difficulty]
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
    stableSetMessages([]);
    setStreak(0);
    setConsecutiveFailures(0);
    setHighlightedFractions([]);
    setPhaseTransition(null);
    setStudentStats({ matches: 0, smashes: 0, merges: 0, streak: 0, uniquePairs: trophies.length });
    setMasteryLevel(0);
    clearSession();
    restartContentRef.current = "[Student has restarted the lesson]";
    hasInitialized.current = false;
    setRestartKey((k) => k + 1);
  }, [stableSetMessages, trophies.length]);

  const handleNextEpisode = useCallback(() => {
    const mastery = loadMastery();
    const next = getNextEpisode(mastery);
    // Clean up pending timers
    if (gameEventTimer.current) clearTimeout(gameEventTimer.current);
    if (systemEventTimer.current) clearTimeout(systemEventTimer.current);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    gameEventQueue.current = null;
    systemEventBuffer.current = [];
    // Reset all session state
    setLessonState(INITIAL_LESSON_STATE);
    setComparisonLeft(null);
    setComparisonRight(null);
    setMatchHistory([]);
    setShowCompletion(false);
    setApiError(null);
    stableSetMessages([]);
    setStreak(0);
    setConsecutiveFailures(0);
    setHighlightedFractions([]);
    setPhaseTransition(null);
    setStudentStats({ matches: 0, smashes: 0, merges: 0, streak: 0, uniquePairs: trophies.length });
    setMasteryLevel(0);
    clearSession();
    setSelectedEpisode(next);
    setCurrentMission(generateChallengeWithReview(playerProgress.level, difficulty, Object.values(loadMastery().skills).filter(s => s.status === "mastered").map(s => s.skill)));
    restartContentRef.current = `[Student started Episode ${next.id}: "${next.title}". Skills: ${next.skills.join(", ")}. Begin with the warmup!]`;
    hasInitialized.current = false;
    setRestartKey((k) => k + 1);
  }, [stableSetMessages, trophies.length, playerProgress.level, difficulty]);

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

    // Quick replies based on lesson phase
    switch (lessonState.phase) {
      case "intro":
        return ["Let's GO!", "I'm ready!", "What are fractions?"];
      case "exploration":
        return ["I did it!", "Show me how!", "Can you help?"];
      case "discovery":
        return ["They're TWINS!", "Whoa cool!", "Find more!"];
      case "practice":
        return ["Found one!", "Give me a hint!", "WE DID IT!"];
      case "assessment":
        return ["I found it!", "Almost there!", "Help me!"];
      case "celebration":
        return ["WE DID IT!", "Again!", "That was AWESOME!"];
      default:
        return [];
    }
  };

  // Filter system messages from display
  const visibleMessages = messages.filter(
    (m) => !m.content.startsWith("[Student") && !m.content.startsWith("[")
  );

  // Episode selection gate — show episode picker before gameplay
  if (!selectedEpisode) {
    return (
      <EpisodeSelect
        onSelect={(ep) => {
          setSelectedEpisode(ep);
          // For early episodes, show teaching intro (chat only, no workspace)
          if (ep.id <= 2) setTeachingIntro(true);
        }}
        onBack={() => router.push("/")}
      />
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-surface">
      {/* Top bar */}
      <div className="flex items-center justify-between px-2.5 py-1 sm:py-1.5 bg-gradient-to-r from-pink-100/80 via-purple-50 to-green-50/80 border-b border-pink-200/60">
        <div className="flex items-center gap-1.5">
          <a
            href="/"
            className="text-sm text-pink-500 active:text-pink-700 px-1"
          >
            ←
          </a>
          <button
            onClick={() => setSelectedEpisode(null)}
            className="px-2.5 py-1.5 bg-white/80 border border-purple-200 text-purple-700 text-[10px] font-bold rounded-full active:scale-95 transition-transform"
          >
            ← Episodes
          </button>
          {selectedEpisode && (
            <span className="text-[10px] font-bold text-purple-600 hidden sm:inline">
              {selectedEpisode.emoji} Ep {selectedEpisode.id}: {selectedEpisode.title}
            </span>
          )}
          <button
            onClick={() => setShowMap(true)}
            className="px-2.5 py-1.5 bg-gradient-to-r from-pink-400 to-purple-500 text-white text-[10px] font-black rounded-full shadow-sm active:scale-95 transition-transform"
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

      {/* Teaching intro — full-screen chat for early episodes before showing workspace */}
      {teachingIntro ? (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 flex flex-col items-center p-2 sm:p-4 min-h-0">
            <div className="w-full max-w-lg flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="text-center py-1 sm:py-2 shrink-0 landscape-compact">
                <span className="text-2xl sm:text-4xl">{selectedEpisode?.emoji || "🍕"}</span>
                <h2 className="text-sm sm:text-lg font-black text-purple-700">
                  {selectedEpisode?.title || "Let's Learn!"}
                </h2>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <ChatPanel
                  messages={visibleMessages}
                  isLoading={isLoading}
                  onSend={handleSend}
                  quickReplies={[
                    "What's a whole?",
                    "I want to share!",
                    "Tell me more!",
                    "I'm ready!",
                  ]}
                  isSpeaking={isSpeaking}
                  characterId={voiceCharacter.id}
                  characterName={voiceCharacter.name}
                />
              </div>
              <button
                onClick={() => setTeachingIntro(false)}
                className="mt-1 sm:mt-3 mx-auto px-6 py-2.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-sm font-black rounded-full shadow-lg active:scale-95 transition-transform shrink-0"
              >
                Let's play! 🎮
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Journey strip — hidden in landscape to save vertical space */}
          <div className="landscape-hide landscape-ipad-hide flex items-center gap-2 px-3 py-0.5">
            <div className="flex-1 min-w-0">
              <JourneyStrip activeIndex={journeyIndex} />
            </div>
          </div>
          <div className="px-3 py-0.5">
            <XPBar
              xp={playerProgress.xp}
              level={playerProgress.level}
              dailyXP={playerProgress.dailyXP}
              dailyGoal={playerProgress.dailyGoal}
            />
          </div>

          {/* Active mission — only in Free Play mode, hidden in landscape */}
          {!episodeMode && (
            <div className="px-3 py-0.5 landscape-hide">
              <MissionCard
                challenge={currentMission}
                solved={missionSolved}
                onSkip={() => {
                  setMissionSolved(false);
                  setCurrentMission(generateChallengeWithReview(playerProgress.level, difficulty, Object.values(loadMastery().skills).filter(s => s.status === "mastered").map(s => s.skill)));
                }}
                onSolve={(challenge) => {
                  setMissionSolved(true);
                  awardXP(challenge.xpReward, "Mission complete!");
                  setTimeout(() => {
                    setMissionSolved(false);
                    setCurrentMission(generateChallengeWithReview(playerProgress.level, difficulty, Object.values(loadMastery().skills).filter(s => s.status === "mastered").map(s => s.skill)));
                  }, 2500);
                }}
              />
            </div>
          )}

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

          {/* Main content — responsive split layout (side-by-side on iPad landscape, stacked otherwise) */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* Chat panel — side panel on large screens, compact strip on phone/iPad portrait */}
            <div className="min-h-0 md:w-[30%] md:min-w-[260px] md:max-w-[340px] md:border-r border-amber-100/60 flex flex-col max-h-[40vh] md:max-h-none overflow-hidden">
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

            {/* Workspace area */}
            <div className="flex-1 min-h-0 flex flex-col">
              {/* Toggle: Episode lessons vs Free Play */}
              {selectedEpisode && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50/60 border-b border-purple-100">
                  <button
                    onClick={() => setEpisodeMode(true)}
                    className={`px-3 py-2 min-h-[44px] text-xs font-bold rounded-full transition-all ${
                      episodeMode
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-white text-purple-500 border border-purple-200"
                    }`}
                  >
                    📝 My Mission
                  </button>
                  <button
                    onClick={() => setEpisodeMode(false)}
                    className={`px-3 py-2 min-h-[44px] text-xs font-bold rounded-full transition-all ${
                      !episodeMode
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-white text-purple-500 border border-purple-200"
                    }`}
                  >
                    🎲 Explore
                  </button>
                </div>
              )}

              <div className="flex-1 min-h-0 p-1 sm:p-1.5 md:p-2">
                {episodeMode && selectedEpisode ? (
                  <EpisodePlayer
                    episode={{
                      id: selectedEpisode.id,
                      title: selectedEpisode.title,
                      emoji: selectedEpisode.emoji,
                      warmup: selectedEpisode.warmup,
                      missions: selectedEpisode.missions,
                      boss: selectedEpisode.boss,
                      exitTicket: selectedEpisode.exitTicket,
                    }}
                    onMissionComplete={(mission, correct, hintUsed) => {
                      // Wire into mastery system — record for ALL episode skills
                      const manip = mission.manipulative as "bar" | "circle" | "numberline" | "partition";
                      for (const skill of selectedEpisode.skills) {
                        recordAttempt(skill, correct, manip, hintUsed);
                      }
                    }}
                    onEpisodeComplete={(xpEarned) => {
                      awardXP(xpEarned, `${selectedEpisode.title} complete!`);
                      completeEpisode(selectedEpisode.id);
                      setTimeout(() => setShowCompletion(true), 1000);
                    }}
                    onMissionChange={(prompt) => setCurrentMissionPrompt(prompt)}
                    onTutorEvent={(event) => {
                      batchSystemEvent(event);
                    }}
                  />
                ) : (
                  <FractionWorkspace
                    comparisonLeft={comparisonLeft}
                    comparisonRight={comparisonRight}
                    onComparisonChange={handleComparisonChange}
                    onMatch={handleMatch}
                    onSmashAction={handleSmashAction}
                    onMergeAction={handleMergeAction}
                    masteryLevel={masteryLevel}
                    unlockedModes={playerProgress.unlockedModes}
                    highlightedFractions={highlightedFractions}
                    suggestedMode={suggestedMode}
                    onModeSwitched={() => setSuggestedMode(null)}
                    playerLevel={playerProgress.level}
                    onXP={(amount: number, label: string) => awardXP(amount, label)}
                    onGameEvent={(event: string) => {
                      gameEventQueue.current = event;
                      if (gameEventTimer.current) clearTimeout(gameEventTimer.current);
                      gameEventTimer.current = setTimeout(() => {
                        const queued = gameEventQueue.current;
                        if (queued && !isLoadingRef.current) {
                          gameEventQueue.current = null;
                          stableAppend({ role: "user", content: queued });
                        }
                      }, 1500);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}

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

      {/* Interactive Swiper challenge — chase Swiper away! */}
      <SwiperChallenge
        show={showSwiperChallenge}
        timeLimit={difficulty === "beginner" ? 8 : difficulty === "expert" ? 3 : 5}
        onSuccess={() => {
          stableAppend({
            role: "user",
            content: "[Student chased Swiper away! Give them a helpful hint as a reward.]",
          });
        }}
        onFail={() => {
          stableAppend({
            role: "user",
            content: "[Swiper got away with a fraction! Encourage the student to keep trying.]",
          });
        }}
        onComplete={() => setShowSwiperChallenge(false)}
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
        onNextEpisode={selectedEpisode && selectedEpisode.id < 18 ? handleNextEpisode : undefined}
        episodeTitle={selectedEpisode?.title}
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
