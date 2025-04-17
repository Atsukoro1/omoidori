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
import { logger } from "./logger";

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
  const contextSummary = await db.contextSummary.findFirst({
    orderBy: { createdAt: "desc" },
  });

  let memorySection = "";
  if (useMemory) {
    const memories = await findSimilarTexts(prompt, 3);
    memorySection = memories.length > 0
      ? `MEMORY CONTEXT:\n${memories.map(m => `- ${m.text}`).join('\n')}`
      : '';
  }

  const systemPrompt = [
    createSystemPrompt(defaultContext),
    memorySection,
    contextSummary?.summary ? `USER CONTEXT:\n${contextSummary.summary}` : "",
  ].filter(Boolean).join("\n\n");

  const { text, toolResults } = await generateText({
    model: openrouter(MODELS.chat_tooling),
    system: systemPrompt,
    temperature: 0.7,
    messages: [{ role: "user", content: prompt }],
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

  const responseText = `${text}${toolResults[0] ? "\n\n".concat(toolResults[0]?.result.result ?? "") : ""}`;

  logger.info({ response: responseText }, "The bot responded with");

  if (useMemory) {
    await Promise.all([
      storeText(`USER INPUT: ${prompt}`),
      storeText(`AI RESPONSE: ${responseText}`)
    ]).catch((e) => logger.error(e, "Failed to store memories"));
  }

  await saveMessage(responseText, true);
  return responseText;
}
