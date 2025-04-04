import cron from "node-cron";
import { db } from "./prisma";
import { generateReminderMessage } from "./reminders";
import { discordClient } from "./discordClient";

export function startReminderCron() {
	cron.schedule("* * * * *", async () => {
		// Every minute
		const dueReminders = await db.reminder.findMany({
			where: {
				dueAt: { lte: new Date() },
				status: "pending",
				retries: { lt: 3 },
			},
		});

		for (const reminder of dueReminders) {
			try {
				const user = await discordClient.users.fetch(reminder.userId);
				const dmChannel = user.dmChannel || (await user.createDM());

				// Generate AI-style message
				const message = await generateReminderMessage(reminder.content);

				await dmChannel.send(message);
				await db.reminder.update({
					where: { id: reminder.id },
					data: { status: "completed" },
				});
			} catch (error) {
				await db.reminder.update({
					where: { id: reminder.id },
					data: { retries: { increment: 1 } },
				});
			}
		}
	});
}
