import type { Message } from "discord.js";
import { db } from "../../lib/prisma";

export const description = "Lists all created notes including their IDs to further delete them.";

export async function execute(message: Message) {
	const notes = await db.note.findMany({
		where: { userId: message.author.id },
		orderBy: { createdAt: "desc" },
		take: 5,
	});

	const response = notes.length
		? notes
				.map(
					(n) =>
						`📄 ${n.id}: ${n.content.slice(0, 50)}${n.content.length > 50 ? "..." : ""}`,
				)
				.join("\n")
		: "No notes yet! Create one with `!note [your text]`";

	await message.reply(response);
}
