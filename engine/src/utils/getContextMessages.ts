import { db } from "../lib/prisma";

const MAX_CONTEXT_MESSAGES = 15;

export async function getContextMessages() {
	const messages = await db.messageHistory.findMany({
		orderBy: { createdAt: "desc" },
		take: MAX_CONTEXT_MESSAGES,
	});

	return messages.map((m) => ({
		role: m.isBot ? "assistant" : ("user" as const),
		content: m.content,
	}));
}
