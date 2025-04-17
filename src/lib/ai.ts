import { generateText, type CoreMessage } from "ai";
import { db } from "./prisma";
import { openrouter } from "./openrouter";
import { createReminderTool } from "../tools/createReminder";
import { deleteAllRemindersTool } from "../tools/deleteAllReminders";
import { listAllRemindersTool } from "../tools/listAllReminders";
import { createNoteTool } from "../tools/createNote";
import { createSystemPrompt } from "../utils/createSystemPrompt";
import { defaultContext } from "../consts/context";
import { MODELS } from "../consts/models";
import { saveMessage } from "../utils/saveMessage";
import { listAllNotesTool } from "../tools/listAllNotes";
import { deleteNoteTool } from "../tools/deleteNote";
import { initVectorDb, storeText, findSimilarTexts } from "../lib/embeddings";

interface AiProcessProps {
  prompt: string;
  includeTools?: boolean;
  useMemory?: boolean;
}

await initVectorDb();

export async function aiProcess({
  prompt,
  includeTools,
  useMemory = true,
}: AiProcessProps) {
  const contextSummary = await db.contextSummary.findFirst({ orderBy: { createdAt: "desc" } });

  const relevantMemories = useMemory 
    ? await findSimilarTexts(prompt, 3)
    : [];

  const memoryContext = relevantMemories.length > 0
    ? `Relevant Memories:\n${relevantMemories.map(m => `- ${m.text} (${m.score.toFixed(2)})`).join('\n')}`
    : '';

  const systemPrompt = [
    createSystemPrompt(defaultContext),
    memoryContext,
    contextSummary?.summary ? `User Context:\n${contextSummary.summary}` : "",
  ].filter(Boolean).join("\n\n");

  let responseText = "";

  const { text, toolResults } = await generateText({
    model: openrouter(MODELS.chat_tooling),
    system: systemPrompt,
    temperature: 0.7,
    messages: [
      { role: "user", content: prompt },
    ],
    ...(includeTools && {
      tools: {
        create_reminder: createReminderTool,
        delete_all_reminders: deleteAllRemindersTool,
        list_all_reminders: listAllRemindersTool,
        create_note: createNoteTool,
        list_all_notes: listAllNotesTool,
        delete_note: deleteNoteTool,
      },
    }),
  });

  responseText = `${text}${toolResults[0] ? "\n\n".concat(toolResults[0]?.result.result ?? "") : ""}`;

  if (useMemory) {
    await Promise.all([
      storeText(prompt),
      storeText(responseText)
    ]).catch(e => console.error("Failed to store memories:", e));
  }

  await saveMessage(responseText, true);

  return responseText;
}
