import type { Message } from "discord.js";
import { db } from "../../lib/prisma";

export async function execute(message: Message, args: string[]) {
	await db.reminder.delete({
		where: { id: args[0] },
	});

	await message.reply("Poof! Reminder vanished like magic ✨");
}
