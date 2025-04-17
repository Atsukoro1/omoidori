import type { Message } from "discord.js";
import { db } from "../../lib/prisma";
import { checkForSummary } from "../../utils/checkForSummary";
import { logger } from "../../lib/logger";

export const description =
	"Force-regenerates the context summary from recent messages";

export async function execute(message: Message) {
	try {
		await checkForSummary(true);

		const currentSummary = await db.contextSummary.findFirst();

		if (!currentSummary) {
			return message.reply(
				"No summary exists yet! I'll create one automatically soon.",
			);
		}

		await message.reply(
			`Summary refreshed successfully! Here's the current version:\n\n${currentSummary.summary}\n\nI'll keep updating it automatically as we chat!`,
		);
	} catch (error) {
		logger.error(error, "Summary refresh failed");
		await message.reply(
			"Failed to refresh summary... maybe try again later? (´；ω；`)",
		);
	}
}
