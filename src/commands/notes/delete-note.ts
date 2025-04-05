import type { Message } from "discord.js";
import { db } from "../../lib/prisma";
import { generateText } from "ai";
import { openrouter } from "../../lib/openrouter";

export const description = "Deletes a note. Usage: !note delete [note-id]";

export async function execute(message: Message, args: string[]) {
	if (!args.length) {
		return message.reply(
			"Please provide a Note ID to delete!\n" +
				"Find IDs using `!notes`\n" +
				"Example: `!note delete 3fa85`",
		);
	}

	const noteIdFragment = args[0];

	try {
		const note = await db.note.findFirst({
			where: {
				id: { startsWith: noteIdFragment },
			},
		});

		if (!note) {
			return message.reply(
				"Couldn't find that note! Check `!notes` for valid IDs",
			);
		}

		const { text: aiResponse } = await generateText({
			model: openrouter("anthropic/claude-3-haiku"),
			system: `You're Omoidori. Confirm note deletion with personality. Rules:
            - 1-2 sentences max
            - Include 1 emoji
            - Reference the note content naturally
            - Sound slightly reluctant but helpful`,
			prompt: `Confirm deletion of note: "${note.content}"`,
		});

		// Delete the note
		await db.note.delete({
			where: { id: note.id },
		});

		await message.reply(
			`${aiResponse}\n` +
				`(Deleted note: ${note.content.slice(0, 30)}${note.content.length > 30 ? "..." : ""})`,
		);
	} catch (error) {
		console.error("Delete failed:", error);
		await message.reply(
			"My notes got all crumpled! Try again maybe? (´；ω；`)",
		);
	}
}
