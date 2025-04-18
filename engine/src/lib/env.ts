import { z } from "zod";
import { logger } from "./logger";

const envSchema = z.object({
    // Postgres database related
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    POSTGRES_DB: z.string(),
    POSTGRES_URL: z.string(),

    // Openrouter
    OPENROUTER_API_KEY: z.string().startsWith("sk-or-v1-", {
        message: "Please provide a valid OpenRouter token, should start with sk-or-v1"
    }),

    // Node process
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    // Qdrant database
    QDRANT_URL: z.string().url(),
    QDRANT_COLLECTION_NAME: z.string(),

    // Websocket configuration
    WEBSOCKET_PORT: z.string(),
    WEBSOCKET_HOST: z.string(),
});

const envParseResult = envSchema.safeParse(process.env);

if (!envParseResult.success) {
  logger.fatal(envParseResult.error.flatten().fieldErrors, "Invalid environment variables");
  process.exit(1);
}

export const env = envParseResult.data;
