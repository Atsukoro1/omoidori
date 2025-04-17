import { db } from "../lib/prisma";
import { checkForSummary } from "./checkForSummary";

export async function saveMessage(content: string, isBot: boolean) {
	const message = await db.messageHistory.create({
		data: { content, isBot },
	});

	await checkForSummary(); // Automatic checks for summaries

	return message;
}
