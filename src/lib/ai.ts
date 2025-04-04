import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, type CoreMessage } from "ai";
import { getContextMessages, saveMessage } from "./memory";
import { db } from "./prisma";
import { defaultContext, createSystemPrompt } from "./context";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function aiProcess(prompt: string) {
  const [contextSummary, messages] = await Promise.all([
    db.contextSummary.findFirst({ orderBy: { createdAt: "desc" } }),
    getContextMessages(),
  ]);

  const systemPrompt = [
    createSystemPrompt(defaultContext),
    contextSummary?.summary ? `User Context:\n${contextSummary.summary}` : ""
  ].join("\n\n");

  const { text } = await generateText({
    model: openrouter("anthropic/claude-3-sonnet"),
    system: systemPrompt,
    messages: [
      ...(messages as CoreMessage[]),
      { role: "user", content: prompt },
    ],
  });

  await saveMessage(text, true);
  return text;
}
