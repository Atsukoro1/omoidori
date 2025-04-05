import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "./env";

if (!env.OPENROUTER_API_KEY) {
    console.error("Specify OpenRouter API key!");
    process.exit();
};

export const openrouter = createOpenRouter({
	apiKey: env.OPENROUTER_API_KEY,
});
