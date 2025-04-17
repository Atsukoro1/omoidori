import { type FeatureExtractionPipeline, pipeline } from "@xenova/transformers";
import { QdrantClient } from "@qdrant/js-client-rest";

const QDRANT_URL = "http://localhost:6333";
const COLLECTION_NAME = "text_memory";
const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

let embeddingModel: FeatureExtractionPipeline | null = null;
const qdrant = new QdrantClient({ url: QDRANT_URL });

async function loadModel() {
  if (!embeddingModel) {
    embeddingModel = await pipeline("feature-extraction", MODEL_NAME, {
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
  
  await qdrant.upsert(COLLECTION_NAME, {
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
  
  const results = await qdrant.search(COLLECTION_NAME, {
    vector: embedding,
    limit,
    with_payload: true,
    with_vector: false,
    score_threshold: 0.5
  });

  console.log(results);

  return results.map(item => ({
    text: item.payload?.text as string,
    score: item.score || 0
  }));
}

export async function initVectorDb() {
  try {
    const { collections } = await qdrant.getCollections();
    const exists = collections.some(c => c.name === COLLECTION_NAME);
    
    if (!exists) {
      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: { size: 384, distance: "Cosine" }
      });
      console.log("Collection created");
    } else {
      console.log("Collection already exists - skipping creation");
    }
  } catch (error) {
    console.error("Vector DB initialization failed:", error);
    throw error;
  }
}
