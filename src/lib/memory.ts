import { generateText } from "ai";
import { db } from "./prisma";
import { openrouter } from "./openrouter";

const MAX_CONTEXT = 20;
const SUMMARY_INTERVAL = 15; // Messages between automatic summaries
const CHEAP_MODEL = "mistralai/mistral-7b-instruct";

export async function getContextMessages() {
	const messages = await db.messageHistory.findMany({
		where: { context: true },
		orderBy: { createdAt: "asc" },
		take: MAX_CONTEXT,
	});

	// Rotate oldest message out of context
	if (messages.length >= MAX_CONTEXT) {
		const oldest = messages[0];
		await db.messageHistory.update({
			where: { id: oldest?.id },
			data: { context: false },
		});
	}

	return messages.map((m) => ({
		role: m.isBot ? "assistant" : ("user" as const),
		content: m.content,
	}));
}

export async function checkForSummary(force = false) {
	const messageCount = await db.messageHistory.count();

	// Run if forced or at interval
	if (force || (messageCount > 0 && messageCount % SUMMARY_INTERVAL === 0)) {
		const lastMessages = await db.messageHistory.findMany({
			orderBy: { createdAt: "desc" },
			take: force ? Math.min(messageCount, 30) : SUMMARY_INTERVAL, // Allow more messages for forced updates
		});

		const conversation = lastMessages
			.reverse()
			.map((m) => `${m.isBot ? "Assistant" : "User"}: ${m.content}`)
			.join("\n");

		// Get or create the single summary
		const existingSummary = await db.contextSummary.findFirst();

		const summaryPrompt = [
			"Current context summary:",
			existingSummary?.summary || "No existing context",
			"New messages to incorporate:",
			conversation,
			"Create an updated 3-sentence summary combining old and new information. Focus specifically on:",
			"- Specific likes/dislikes the user has shown",
			"- Recurring activities or routines",
			"- Important relationships/people mentioned",
			"- Frequently mentioned locations or environments",
			"- Notable goals or challenges they're facing",
			"Keep it concise while prioritizing personal details about the user's life and preferences.",
		].join("\n");

		const { text: updatedSummary } = await generateText({
			model: openrouter(CHEAP_MODEL),
			prompt: summaryPrompt,
			maxTokens: 300,
			temperature: 0.3,
		});

		// Upsert the single summary record
		if (existingSummary) {
			await db.contextSummary.update({
				where: { id: existingSummary.id },
				data: {
					summary: updatedSummary,
					createdAt: new Date(), // Refresh timestamp
				},
			});
		} else {
			await db.contextSummary.create({
				data: { summary: updatedSummary },
			});
		}

		return updatedSummary; // Return for manual refresh commands
	}
	return null;
}

export async function saveMessage(content: string, isBot: boolean) {
	const message = await db.messageHistory.create({
		data: { content, isBot },
	});
	await checkForSummary(); // Automatic checks
	return message;
}
