import { z } from "zod";
import { db } from "../lib/prisma";

const deleteNoteToolSchema = z.object({
    noteId: z.string().describe("Id of the note, to delete")
});

export const deleteNoteTool = {
    description: "Delete note using it's id",
    parameters: deleteNoteToolSchema,
    execute: async (args: z.infer<typeof deleteNoteToolSchema>) => {
        if (!args.noteId) {
            throw new Error("Please provide id of the note to delete!");
        };

        const deletedNote = await db.note.delete({
            where: {
                id: args.noteId
            }
        });

        return {
            success: !!deletedNote,
            result: null,
        }
    }
}
