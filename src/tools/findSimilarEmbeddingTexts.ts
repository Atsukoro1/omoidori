import { env } from "../lib/env";
import { logger } from "../lib/logger";
import { qdrant } from "../lib/qdrantDb";
import { getEmbedding } from "../utils/getEmbedding";

export const findSimilarEmbeddingTexts = async (
  query: string,
  limit = 5
): Promise<{ text: string; score: number }[]> => {
  const embedding = await getEmbedding(query);

  const results = await qdrant.search(env.QDRANT_COLLECTION_NAME, {
    vector: embedding,
    limit,
    with_payload: true,
    with_vector: false,
    score_threshold: 0.5,
  });

  const formattedResults = results.map((item) => ({
    text: item.payload?.text as string,
    score: item.score || 0,
  }));

  logger.info(
    formattedResults,
    formattedResults.length === 0
      ? "Found no similar results to user's message"
      : "Found the most similar results to user's message"
  );

  return formattedResults;
};
