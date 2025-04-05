import { z } from "zod";
import { db } from "../lib/prisma";

const listAllRemindersSchema = z.object({});

export const listAllRemindersTool = {
	description: "Lists all un-reminded reminders",
	parameters: listAllRemindersSchema,
	execute: async () => {
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

		return reminders
			.map(
				(reminder) =>
					`${reminder.content} due to ${reminder.dueAt.toLocaleString()}`,
			)
			.join("\n");
	},
};
