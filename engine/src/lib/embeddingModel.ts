import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";
import { MODELS } from "../consts/models";

export let embeddingModel: FeatureExtractionPipeline | null = null;

export const loadEmbeddingModel = async () => {
  if (!embeddingModel) {
    embeddingModel = await pipeline("feature-extraction", MODELS.embeddings, {
      quantized: true,
    });
  }
  return embeddingModel;
}
