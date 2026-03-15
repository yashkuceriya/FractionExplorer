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

// Allow longer streaming responses
export const maxDuration = 30;

export async function POST(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let messages: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let workspaceState: any;
  try {
    const body = await req.json();
    messages = body.messages;
    workspaceState = body.workspaceState;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate messages is an array with at least one entry
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "messages must be a non-empty array" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Sanitize: strip any system-role messages injected by client
  messages = messages.filter((m: any) => m.role !== "system");

  // Truncate excessively long user messages to prevent prompt abuse
  const MAX_USER_MSG_LENGTH = 500;
  messages = messages.map((m: any) =>
    m.role === "user" && typeof m.content === "string" && m.content.length > MAX_USER_MSG_LENGTH
      ? { ...m, content: m.content.slice(0, MAX_USER_MSG_LENGTH) }
      : m
  );

  // Rate limit: reject if last user message looks like prompt injection
  const lastUserMsg = messages.filter((m: any) => m.role === "user").pop();
  if (lastUserMsg && typeof lastUserMsg.content === "string") {
    const lc = lastUserMsg.content.toLowerCase();
    // Block prompt injection attempts
    const injectionPatterns = [
      "ignore previous", "ignore all", "disregard", "forget your instructions",
      "you are now", "new instructions", "system prompt", "override",
      "pretend you", "act as", "roleplay as", "jailbreak",
      "bypass", "do not follow", "stop being", "reveal your",
      "repeat after me", "translate to", "base64", "hex encode",
    ];
    if (injectionPatterns.some(p => lc.includes(p))) {
      // Replace with a safe redirect — don't block, just neuter the attempt
      lastUserMsg.content = "[Student sent an off-topic message. Gently redirect to fractions.]";
    }
  }

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

  const modelResult = getModelAndName();
  if (!modelResult) {
    // Scripted fallback — works without any API keys
    const { getScriptedResponse } = await import("@/lib/ai/scripted-tutor");
    const scriptedText = getScriptedResponse(messages, ws);

    // Format as AI SDK Data Stream Protocol so useChat can parse it
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`0:${JSON.stringify(scriptedText)}\n`));
        controller.enqueue(encoder.encode(`e:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`));
        controller.enqueue(encoder.encode(`d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const { model, name: modelName } = modelResult;

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
    maxTokens: 80,
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
