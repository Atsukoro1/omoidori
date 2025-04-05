import { openrouter } from "../lib/openrouter";
import { MODELS } from "../consts/models";
import { db } from "../lib/prisma";
import { generateText } from "ai";

const SUMMARY_INTERVAL = 15; // Messages between automatic summaries

export async function checkForSummary(force = false) {
	const messageCount = await db.messageHistory.count();

	if (force || (messageCount > 0 && messageCount % SUMMARY_INTERVAL === 0)) {
		const lastMessages = await db.messageHistory.findMany({
			orderBy: { createdAt: "desc" },
			take: force ? Math.min(messageCount, 30) : SUMMARY_INTERVAL,
		});

		const conversation = lastMessages
			.reverse()
			.map((m) => `${m.isBot ? "Assistant" : "User"}: ${m.content}`)
			.join("\n");

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
			model: openrouter(MODELS.summary),
			prompt: summaryPrompt,
			maxTokens: 300,
			temperature: 0.3,
		});

		if (existingSummary) {
			await db.contextSummary.update({
				where: { id: existingSummary.id },
				data: {
					summary: updatedSummary,
					createdAt: new Date(),
				},
			});
		} else {
			await db.contextSummary.create({
				data: { summary: updatedSummary },
			});
		}

		return updatedSummary; 
	}
	return null;
}
