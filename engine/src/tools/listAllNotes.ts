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
            result: `Your notes are: ${notes.map(note => note.content).join(", ")}`,
        }
    }
};
