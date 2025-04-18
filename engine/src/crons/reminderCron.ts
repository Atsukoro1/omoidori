import cron from "node-cron";
import { db } from "../lib/prisma";
import { generateReminderMessage } from "../utils/generateReminderMessage";
import { socket } from "..";
import { logger } from "../lib/logger";

export const startReminderCron = () => {
    logger.info("Scheduled reminder cron for every minute!");

    cron.schedule("* * * * *", async () => {
        const dueReminders = await db.reminder.findMany({
            where: {
                dueAt: { lte: new Date() },
                status: "pending",
                retries: { lt: 3 },
            },
        });

        for (const reminder of dueReminders) {
            try {
                const message = await generateReminderMessage(reminder.content);

                socket?.send(message);
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
