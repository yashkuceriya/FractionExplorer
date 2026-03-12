import { Client } from "langsmith";
import { RunTree } from "langsmith";

// LangSmith client — initialized lazily
let client: Client | null = null;

function getClient(): Client | null {
  if (!process.env.LANGSMITH_API_KEY) return null;
  if (!client) {
    client = new Client({
      apiKey: process.env.LANGSMITH_API_KEY,
      apiUrl: process.env.LANGSMITH_ENDPOINT || "https://api.smith.langchain.com",
    });
  }
  return client;
}

export interface TracingMetadata {
  lessonStep: number;
  lessonPhase: string;
  comparisonLeft: string | null;
  comparisonRight: string | null;
  messageCount: number;
  completedChallenges: number;
}

export async function createTutorRun(metadata: TracingMetadata) {
  const projectName = process.env.LANGSMITH_PROJECT || "synthesis-tutor";

  const runTree = new RunTree({
    name: "tutor-response",
    run_type: "chain",
    project_name: projectName,
    inputs: {
      lesson_step: metadata.lessonStep,
      lesson_phase: metadata.lessonPhase,
      comparison_left: metadata.comparisonLeft,
      comparison_right: metadata.comparisonRight,
      message_count: metadata.messageCount,
      completed_challenges: metadata.completedChallenges,
    },
    extra: {
      metadata: {
        app: "synthesis-tutor",
        ...metadata,
      },
    },
  });

  return runTree;
}

export async function trackLLMCall(
  parentRun: RunTree,
  {
    model,
    systemPrompt,
    messages,
  }: {
    model: string;
    systemPrompt: string;
    messages: Array<{ role: string; content: string }>;
  }
) {
  const llmRun = parentRun.createChild({
    name: "llm-call",
    run_type: "llm",
    inputs: {
      model,
      system: systemPrompt,
      messages: messages.slice(-5), // Last 5 messages for context
      total_messages: messages.length,
    },
  });

  return llmRun;
}

export async function endRun(
  run: RunTree,
  {
    output,
    tokensUsed,
    error,
  }: {
    output?: string;
    tokensUsed?: { prompt: number; completion: number; total: number };
    error?: string;
  }
) {
  try {
    if (error) {
      run.end({ error });
    } else {
      run.end({
        outputs: {
          response: output?.substring(0, 500),
          tokens: tokensUsed,
        },
      });
    }
    await run.postRun();
  } catch (e) {
    // Don't let tracing failures break the app
    console.warn("LangSmith tracing error:", e);
  }
}

// Simple in-memory cost tracker for the session (also sent to LangSmith)
export interface UsageStats {
  totalCalls: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  model: string;
}

// Cost per 1M tokens (approximate)
const COST_PER_1M: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-20250514": { input: 3.0, output: 15.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
};

const sessionStats: UsageStats = {
  totalCalls: 0,
  totalPromptTokens: 0,
  totalCompletionTokens: 0,
  totalTokens: 0,
  estimatedCost: 0,
  model: "",
};

export function trackUsage(model: string, promptTokens: number, completionTokens: number) {
  sessionStats.model = model;
  sessionStats.totalCalls += 1;
  sessionStats.totalPromptTokens += promptTokens;
  sessionStats.totalCompletionTokens += completionTokens;
  sessionStats.totalTokens += promptTokens + completionTokens;

  const costs = COST_PER_1M[model] || { input: 1.0, output: 3.0 };
  sessionStats.estimatedCost +=
    (promptTokens / 1_000_000) * costs.input +
    (completionTokens / 1_000_000) * costs.output;
}

export function getSessionStats(): UsageStats {
  return { ...sessionStats };
}
