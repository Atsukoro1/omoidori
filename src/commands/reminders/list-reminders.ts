import type { Message } from "discord.js";
import { db } from "../../lib/prisma";

export async function execute(message: Message) {
	const reminders = await db.reminder.findMany({
		where: { userId: message.author.id, status: "pending" },
	});

	const response =
		reminders
			.map(
				(r) =>
					`⏰ **${r.content}** - <t:${Math.floor(r.dueAt.getTime() / 1000)}:R>`,
			)
			.join("\n") || "No pending reminders~";

	await message.reply(response);
}
