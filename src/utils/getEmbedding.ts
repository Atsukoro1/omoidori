import { loadEmbeddingModel } from "../lib/embeddingModel";

export const getEmbedding = async (text: string): Promise<number[]> => {
  const model = await loadEmbeddingModel();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}
