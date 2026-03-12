export interface LessonState {
  step: number;
  totalSteps: number;
  phase: "intro" | "exploration" | "discovery" | "practice" | "assessment" | "celebration";
  comparisonLeft: string | null;
  comparisonRight: string | null;
  completedChallenges: number;
}

export const INITIAL_LESSON_STATE: LessonState = {
  step: 1,
  totalSteps: 6,
  phase: "intro",
  comparisonLeft: null,
  comparisonRight: null,
  completedChallenges: 0,
};

export function advanceLesson(state: LessonState): LessonState {
  const phases: LessonState["phase"][] = [
    "intro",
    "exploration",
    "discovery",
    "practice",
    "assessment",
    "celebration",
  ];
  const currentIndex = phases.indexOf(state.phase);
  const nextIndex = Math.min(currentIndex + 1, phases.length - 1);

  return {
    ...state,
    step: nextIndex + 1,
    phase: phases[nextIndex],
  };
}
