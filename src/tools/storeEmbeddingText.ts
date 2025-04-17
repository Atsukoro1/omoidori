import { env } from "../lib/env";
import { qdrant } from "../lib/qdrantDb";
import { getEmbedding } from "../utils/getEmbedding";

export const storeEmbeddingText = async (text: string) => {
  const embedding = await getEmbedding(text);
  
  await qdrant.upsert(env.QDRANT_COLLECTION_NAME, {
    points: [{
      id: Date.now(),
      vector: embedding,
      payload: { 
        text, 
        timestamp: new Date().toISOString() 
      }
    }]
  });
}
