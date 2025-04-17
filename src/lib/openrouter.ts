import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "./env";
import { logger } from "./logger";

if (!env.OPENROUTER_API_KEY) {
    logger.fatal("No OpenRouter API key specified!");
    process.exit();
};

export const openrouter = createOpenRouter({
	apiKey: env.OPENROUTER_API_KEY,
});
