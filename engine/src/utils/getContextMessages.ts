import { db } from "../lib/prisma";

const MAX_CONTEXT = 20;

export async function getContextMessages() {
	const messages = await db.messageHistory.findMany({
		where: { context: true },
		orderBy: { createdAt: "asc" },
		take: MAX_CONTEXT,
	});

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
