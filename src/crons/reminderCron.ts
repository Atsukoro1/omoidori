import cron from "node-cron";
import { db } from "../lib/prisma";
import { discordClient } from "../lib/discordClient";
import { generateReminderMessage } from "../utils/generateReminderMessage";
import { env } from "../lib/env";

export const startReminderCron = () => {
    // Every minute
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
                const user = await discordClient.users.fetch(env.OWNER_USER_ID as string);
                const dmChannel = user.dmChannel || (await user.createDM());

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
