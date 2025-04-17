import { type FeatureExtractionPipeline, pipeline } from "@xenova/transformers";
import { QdrantClient } from "@qdrant/js-client-rest";
import { MODELS } from "../consts/models";
import { env } from "./env";
import { logger } from "./logger";

let embeddingModel: FeatureExtractionPipeline | null = null;
const qdrant = new QdrantClient({ url: env.QDRANT_URL });

async function loadModel() {
  if (!embeddingModel) {
    embeddingModel = await pipeline("feature-extraction", MODELS.embeddings, {
      quantized: true,
    });
  }
  return embeddingModel;
}

export async function getEmbedding(text: string): Promise<number[]> {
  const model = await loadModel();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

export async function storeText(text: string) {
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

export async function findSimilarTexts(
  query: string, 
  limit = 5
): Promise<{text: string, score: number}[]> {
  const embedding = await getEmbedding(query);
  
  const results = await qdrant.search(env.QDRANT_COLLECTION_NAME, {
    vector: embedding,
    limit,
    with_payload: true,
    with_vector: false,
    score_threshold: 0.5
  });

  const outputResults = results.map(item => ({
    text: item.payload?.text as string,
    score: item.score || 0
  }));

  logger.info(outputResults, "Found the most similar results to user message");

  return outputResults;
}

export async function initVectorDb() {
  try {
    const { collections } = await qdrant.getCollections();
    const exists = collections.some(c => c.name === env.QDRANT_COLLECTION_NAME);
    
    if (!exists) {
      await qdrant.createCollection(env.QDRANT_COLLECTION_NAME, {
        vectors: { size: 384, distance: "Cosine" }
      });
      
      logger.info(null, `Qdrant collection "${env.QDRANT_COLLECTION_NAME}" created`);
    } else {
      logger.info(null, `Qdrant collection "${env.QDRANT_COLLECTION_NAME}" already exists - skipping creation`)
    }
  } catch (error) {
    logger.error(error, "Qdrant initialization failed");
    throw error;
  }
}
