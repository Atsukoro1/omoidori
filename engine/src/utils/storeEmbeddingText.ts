import { env } from "../lib/env";
import { logger } from "../lib/logger";
import { qdrant } from "../lib/qdrantDb";
import { getEmbedding } from "./getEmbedding";
import { classifyMessage } from "./messageClasssifier";

export const storeEmbeddingText = async (text: string) => {
  const { isQuestion, isFact, requiresFollowup } = await classifyMessage(text);

  const tags = [];
  if (isQuestion) tags.push("[QUESTION]");
  if (isFact) tags.push("[FACT]");
  if (requiresFollowup) tags.push("[FOLLOWUP]");
  const embeddingText = `${text} ${tags.join(" ")}`.trim();

  logger.info({ text, embeddingText }, "Storing vector message from user with classification:");

  const embedding = await getEmbedding(embeddingText);
  
  await qdrant.upsert(env.QDRANT_COLLECTION_NAME, {
    points: [{
      id: Date.now(),
      vector: embedding,
      payload: { 
        text,
        enhancedText: embeddingText,
        timestamp: new Date().toISOString(),
        isQuestion,
        isFact,
        requiresFollowup
      }
    }]
  });
}