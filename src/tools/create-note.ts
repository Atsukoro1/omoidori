import { z } from "zod";
import { db } from "../lib/prisma";

const createNoteSchema = z.object({
    content: z.string().describe("The content of the note"),
});

export const createNoteTool = {
    description: "Creates a note with specific content",
    parameters: createNoteSchema,
    execute: async (args: z.infer<typeof createNoteSchema>) => {
        if (!args.content) {
            throw new Error("Please provide content of the note.");
        };

        const note = await db.note.create({
            data: {
                content: args.content,
                tags: [],
            }
        });

        return {
            success: true,
            noteId: note.id,
            content: note.content
        }
    }
};
