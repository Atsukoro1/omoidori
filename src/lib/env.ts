import { z } from "zod";

const envSchema = z.object({
    // Database related
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    POSTGRES_DB: z.string(),
    POSTGRES_URL: z.string(),
    
    // Discord bot related
    DISCORD_TOKEN: z.string(),
    OWNER_USER_ID: z.string(),

    // Openrouter
    OPENROUTER_API_KEY: z.string().startsWith("sk-or-v1-", {
        message: "Please provide a valid OpenRouter token, should start with sk-or-v1"
    }),

    // Node process
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const envParseResult = envSchema.safeParse(process.env);

if (!envParseResult.success) {
  console.error(
    "❌ Invalid environment variables:",
    envParseResult.error.flatten().fieldErrors
  );
  process.exit(1);
}

export const env = envParseResult.data;
