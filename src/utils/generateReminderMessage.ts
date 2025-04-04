import { aiProcess } from "../lib/ai";

export async function generateReminderMessage(content: string) {
    return aiProcess({
        prompt: `Create urgent but cute reminder text for: "${content}"\nFormat: [Emoji] [Direct instruction] [Encouragement]\nExample: "🧺 Hey! Time to wash those clothes right now! You'll feel so fresh after! ✨"`,
        // Not including tools and message history to prevent loops
        includeMessageHistory: false,
        includeTools: false,
    });
}
