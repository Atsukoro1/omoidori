import { z } from "zod";
import { db } from "../lib/prisma";

export const listAllNotesTool = {
    description: "List all notes",
    parameters: z.object({}),
    execute: async () => {
        const notes = await db.note.findMany({
            select: {
                content: true,
                id: true,
            }
        });

        return {
            success: true,
            result: notes.map(note => {
                return `\`${note.id}\` - ${note.content}`
            }).join("\n"),
        }
    }
};
