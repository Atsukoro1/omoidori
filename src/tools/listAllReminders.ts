import { z } from "zod";
import { db } from "../lib/prisma";

export const listAllRemindersTool = {
	description: "Lists all un-reminded reminders",
	parameters: z.object({}),
	execute: async () => {
		const reminders = await db.reminder.findMany({
			where: {
				status: "pending",
			},
			select: {
				content: true,
				dueAt: true,
			},
		});

		return {
			success: true,
			result: reminders
				.map(
					(reminder) =>
						`${reminder.content} due to \`${reminder.dueAt.toLocaleString()}\``,
				)
				.join("\n"),
		};
	},
};
