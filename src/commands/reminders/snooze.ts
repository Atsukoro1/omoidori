import type { Message } from "discord.js";
import { db } from "../../lib/prisma";
import ms from 'ms';

export async function execute(message: Message, args: string[]) {
	const duration = ms(Number(args[1]));
	await db.reminder.update({
		where: { id: args[0] },
		data: { dueAt: new Date(Date.now() + duration) },
	});

	await message.reply("Snoozed! I'll remind you later~ 😴");
}
