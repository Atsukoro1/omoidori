import { env } from "../lib/env";
import { logger } from "../lib/logger";
import { qdrant } from "../lib/qdrantDb";
import { getEmbedding } from "./getEmbedding";

interface SearchResult {
    text: string;
    enhancedText: string;
    score: number;
    isQuestion?: boolean;
    isFact?: boolean;
}

export const findSimilarEmbeddingTexts = async (
    query: string,
    limit = 5
): Promise<SearchResult[]> => {
    const enhancedQuery = `${query} [CONTEXT]`;
    const embedding = await getEmbedding(enhancedQuery);

    const results = await qdrant.search(env.QDRANT_COLLECTION_NAME, {
        vector: embedding,
        limit,
        with_payload: true,
        with_vector: false,
        score_threshold: 0.6,
        filter: {
            must_not: [
                { key: "isQuestion", match: { value: true } }
            ]
        }
    });

    const formattedResults = results.map((item) => ({
        text: item.payload?.text as string,
        enhancedText: item.payload?.enhancedText as string,
        score: item.score || 0,
        isQuestion: item.payload?.isQuestion,
        isFact: item.payload?.isFact
    }));

    logger.info(
        { results: formattedResults },
        formattedResults.length === 0
            ? "No relevant context found"
            : "Found relevant context"
    );

    return formattedResults as SearchResult[];
};