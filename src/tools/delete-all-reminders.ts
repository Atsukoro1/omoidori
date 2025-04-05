import { z } from "zod";
import { db } from "../lib/prisma"

const deleteAllRemindersSchema = z.object({});

export const deleteAllRemindersTool = {
    description: "Delete all reminders",
    parameters: deleteAllRemindersSchema,
    execute: async (args: unknown) => {
        const remindersDeleted = await db.reminder.deleteMany();

        return {
            success: true,
            remindersDeleted: remindersDeleted.count
        };
    }
}
