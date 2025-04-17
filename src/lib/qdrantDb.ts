import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "./env";
import { logger } from "./logger";

export const qdrant = new QdrantClient({ url: env.QDRANT_URL });

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
