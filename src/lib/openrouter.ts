import { createOpenRouter } from "@openrouter/ai-sdk-provider";

if (!process.env.OPENROUTER_API_KEY) {
    console.error("Specify OpenRouter API key!");
    process.exit();
};

export const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});
