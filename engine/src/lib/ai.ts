import { generateText, type CoreMessage } from "ai";
import { db } from "./prisma";
import { openrouter } from "./openrouter";
import { createSystemPrompt } from "../utils/createSystemPrompt";
import { defaultContext } from "../consts/context";
import { MODELS } from "../consts/models";
import { saveMessage } from "../utils/saveMessage";
import { logger } from "./logger";
import { initVectorDb } from "./qdrantDb";
import { storeEmbeddingText } from "../utils/storeEmbeddingText";
import { findSimilarEmbeddingTexts } from "../utils/findSimilarEmbeddingTexts";
import { getContextMessages } from "../utils/getContextMessages";
import { generateAudio } from "../utils/generateAudio";
import { socket } from "..";
import { env } from "./env";

interface AiProcessProps {
  prompt: string;
  useMemory?: boolean;
  includeMessages?: boolean;
  sendMetadata?: boolean;
  useVoiceGeneration?: boolean;
}

await initVectorDb();

export async function aiProcess({
  prompt,
  useMemory = true,
  includeMessages = false,
  useVoiceGeneration = false,
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

  console.log(messages);

  const systemPrompt = [
    createSystemPrompt(defaultContext),
    memorySection,
    contextSummary?.summary ? `USER CONTEXT:\n${contextSummary.summary}` : "",
  ].filter(Boolean).join("\n\n");

  const { text } = await generateText({
    model: openrouter(MODELS.chat_tooling),
    system: systemPrompt,
    temperature: 0.7,
    messages: [...messages, { role: "user", content: prompt }],
  });

  logger.info({ response: text }, "The bot responded with");

  if (useMemory) {
    try {
      await storeEmbeddingText(prompt);
    } catch (e) {
      logger.error(e, "Failed to store memories")
    };
  }

  if (useVoiceGeneration) {
    await generateAudio(text);
    
    const socketResponse: SocketResponse = {
      type: 'new_audio',
      data: `http://localhost:${env.HTTP_SERVER_PORT}/audio/latest.mp3`
    };

    socket?.send(JSON.stringify(socketResponse));
  }

  await saveMessage(text, true);
  await saveMessage(prompt, false);

  return text;
}
