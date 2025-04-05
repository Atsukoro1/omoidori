import { z } from "zod";
import * as chrono from "chrono-node";
import { db } from "../lib/prisma";

const reminderSchema = z.object({
	content: z.string().describe("The reminder content/task"),
	time_expression: z
		.string()
		.describe(
			"Natural language time reference (e.g. 'in 30 minutes', 'tomorrow at 3pm')",
		),
});

export const createReminderTool = {
	description: "Creates a reminder with specific content and time",
	parameters: reminderSchema,
	execute: async (args: z.infer<typeof reminderSchema>) => {
		const parsedDate = chrono.parseDate(args.time_expression);

		if (!parsedDate || parsedDate < new Date()) {
			throw new Error("Invalid time format or past date");
		}

		const reminder = await db.reminder.create({
			data: {
				content: args.content,
				dueAt: parsedDate,
			},
		});

		return {
			success: true,
			reminderId: reminder.id,
			dueAt: parsedDate.toISOString(),
		};
	},
};
