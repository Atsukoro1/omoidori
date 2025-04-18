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
import { logger } from "./logger";
import { initVectorDb } from "./qdrantDb";
import { storeEmbeddingText } from "../utils/storeEmbeddingText";
import { findSimilarEmbeddingTexts } from "../utils/findSimilarEmbeddingTexts";
import { getContextMessages } from "../utils/getContextMessages";

interface AiProcessProps {
  prompt: string;
  includeTools?: boolean;
  useMemory?: boolean;
  includeMessages?: boolean;
}

await initVectorDb();

export async function aiProcess({
  prompt,
  includeTools,
  useMemory = true,
  includeMessages = false,
}: AiProcessProps) {
  const [contextSummary, rawMessages] = await Promise.all([
    db.contextSummary.findFirst({ orderBy: { createdAt: "desc" } }),
    getContextMessages(),
  ]);

  /**
   * Known messages from Qdrant (vector DB) that are similar to what user said now
   */
  let memorySection = "";
  if (useMemory) {
    const memories = await findSimilarEmbeddingTexts(prompt, 5);
    memorySection = memories.length > 0
      ? `MEMORY CONTEXT:\n${memories.map(m => `- ${m.text}`).join('\n')}`
      : '';
  }

  /**
   * Latest messages from postgres database (only few of them)
   */
  let messages: CoreMessage[] = [];
  if (includeMessages) {
    messages = rawMessages.length === 0 ? [] : rawMessages.map(message => ({
      role: message.role as 'user' | 'assistant',
      content: message.content
    }));
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
    messages: [{ ...messages, role: "user", content: prompt }],
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

  const responseText = `${text}${toolResults[0] ? " ".concat(toolResults[0]?.result.result ?? "") : ""}`;

  logger.info({ response: responseText }, "The bot responded with");

  if (useMemory) {
    try {
      await storeEmbeddingText(prompt);
    } catch (e) {
      logger.error(e, "Failed to store memories")
    };
  }

  await saveMessage(responseText, true);
  await saveMessage(prompt, false);

  return responseText;
}
