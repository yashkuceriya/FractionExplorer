import { streamText, type CoreMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { TUTOR_SYSTEM_PROMPT, buildContextMessage } from "@/lib/ai/system-prompt";
import { createTutorRun, trackLLMCall, endRun, trackUsage } from "@/lib/ai/langsmith";

// Limit conversation history to prevent unbounded context growth
const MAX_MESSAGES = 40;

function trimMessages(messages: CoreMessage[]): CoreMessage[] {
  if (messages.length <= MAX_MESSAGES) return messages;
  // Always keep the first message (lesson join) and the most recent messages
  return [messages[0], ...messages.slice(-MAX_MESSAGES + 1)];
}

function getModelAndName() {
  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return { model: anthropic("claude-sonnet-4-20250514"), name: "claude-sonnet-4-20250514" };
  }
  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return { model: openai("gpt-4o-mini"), name: "gpt-4o-mini" };
  }
  return null;
}

export async function POST(req: Request) {
  const { messages, workspaceState } = await req.json();

  const ws = workspaceState || {
    comparisonLeft: null,
    comparisonRight: null,
    lessonStep: 1,
    totalSteps: 6,
    lessonPhase: "intro",
    completedChallenges: 0,
    matchHistory: [],
  };

  const contextMessage = buildContextMessage(ws);
  const systemPrompt = `${TUTOR_SYSTEM_PROMPT}\n\n## Current Workspace State\n${contextMessage}`;

  const result_or_null = getModelAndName();
  if (!result_or_null) {
    return new Response(
      JSON.stringify({ error: "No API key configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env.local" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  const { model, name: modelName } = result_or_null;

  // Trim conversation history to avoid unbounded context growth
  const trimmedMessages = trimMessages(messages);

  // LangSmith tracing (non-blocking — won't break if unconfigured)
  let parentRun: Awaited<ReturnType<typeof createTutorRun>> | null = null;
  let llmRun: Awaited<ReturnType<typeof trackLLMCall>> | null = null;

  try {
    parentRun = await createTutorRun({
      lessonStep: ws.lessonStep,
      lessonPhase: ws.lessonPhase || "intro",
      comparisonLeft: ws.comparisonLeft,
      comparisonRight: ws.comparisonRight,
      messageCount: messages.length,
      completedChallenges: ws.completedChallenges || 0,
    });
    await parentRun.postRun();

    llmRun = await trackLLMCall(parentRun, {
      model: modelName,
      systemPrompt,
      messages,
    });
    await llmRun.postRun();
  } catch {
    // Tracing is best-effort
  }

  const result = streamText({
    model,
    system: systemPrompt,
    messages: trimmedMessages,
    temperature: 0.85,
    maxTokens: 250,
    onFinish: async ({ text, usage }) => {
      // Track token usage
      const promptTokens = usage?.promptTokens || 0;
      const completionTokens = usage?.completionTokens || 0;
      trackUsage(modelName, promptTokens, completionTokens);

      // Complete LangSmith traces
      try {
        if (llmRun) {
          await endRun(llmRun, {
            output: text,
            tokensUsed: {
              prompt: promptTokens,
              completion: completionTokens,
              total: promptTokens + completionTokens,
            },
          });
        }
        if (parentRun) {
          await endRun(parentRun, {
            output: text,
            tokensUsed: {
              prompt: promptTokens,
              completion: completionTokens,
              total: promptTokens + completionTokens,
            },
          });
        }
      } catch {
        // Best-effort tracing
      }
    },
  });

  return result.toDataStreamResponse();
}
