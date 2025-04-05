import { z } from "zod";
import { db } from "../lib/prisma";

const listAllRemindersSchema = z.object({});

export const listAllRemindersTool = {
	description: "Lists all un-reminded reminders",
	parameters: listAllRemindersSchema,
	execute: async (args: unknown) => {
		const reminders = await db.reminder.findMany({
			where: {
				status: {
					not: "complete",
				},
			},
			select: {
				content: true,
				dueAt: true,
			},
		});

		console.log(reminders);

		return {
			success: true,
			remindersLeft: reminders
				.map(
					(reminder) =>
						`${reminder.content} due to ${reminder.dueAt.toLocaleString()}`,
				)
				.join("\n"),
		};
	},
};
