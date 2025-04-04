import type { Message } from 'discord.js';
import { db } from '../../lib/prisma';
import * as chrono from 'chrono-node';
import { generateText } from 'ai';
import { openrouter } from '../../lib/openrouter';
import { generateReminderMessage } from '../../lib/reminders';

export const description = "Creates a new reminder from natural language. Usage: !remind [message with time]";

export async function execute(message: Message, args: string[]) {
    if (!args.length) {
        return message.reply("Please include your reminder! Examples:\n" +
            "• `!remind me to water plants in 30 minutes`\n" +
            "• `!remind about team meeting tomorrow at 3pm`");
    }

    try {
        // Use AI to extract time and content
        const { text: analysis } = await generateText({
            model: openrouter('anthropic/claude-3-haiku'), // Fast and cheap
            system: `Extract time and reminder content from this format:
            Input: "remind me to walk dog in 1 hour"
            Output: {"time": "in 1 hour", "content": "walk dog"}
            
            Return ONLY valid JSON`,
            prompt: args.join(' ')
        });

        const { time, content } = JSON.parse(analysis);
        
        if (!time || !content) {
            throw new Error("Couldn't parse time and content");
        }

        // Parse the extracted time
        chrono.parseDate(time as string)
        const parsedDate = chrono.parseDate(time as string);
        if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
            throw new Error("Invalid time format");
        }

        // Rest of your validation and creation logic...
        if (parsedDate.getTime() < Date.now()) {
            return message.reply("Time travel isn't supported yet! ⏳");
        }

        await db.reminder.create({
            data: {
                content,
                dueAt: parsedDate,
                userId: message.author.id
            }
        });

        const response = await generateReminderMessage(
            `I'll remind you to "${content}" at ${parsedDate.toLocaleString()}`
        );

        await message.reply(response);

    } catch (error) {
        console.error("Reminder creation failed:", error);
        return message.reply("Let's try that again! Example formats:\n" +
            "• `!remind water plants in 30m`\n" +
            "• `!remind team meeting tomorrow 3pm`");
    }
}
