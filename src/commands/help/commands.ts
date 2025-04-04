// src/commands/help/commands.ts
import type { Message } from "discord.js";
import { commands } from "../index";

export async function execute(message: Message) {
	try {
		// Group commands by category
		const commandGroups: Record<string, string[]> = {};

		// biome-ignore lint/complexity/noForEach: Small arrays are OK, won't affect performance
		commands.forEach((cmd) => {
			const [category, name] = cmd.name.split(":");
			if (!commandGroups[category as string]) {
				commandGroups[category as string] = [];
			}
			commandGroups[category as string]?.push(name as string);
		});

		// Format the response
		let response = "Here are my available commands:\n\n";
		for (const [category, names] of Object.entries(commandGroups)) {
			response += `**${category.charAt(0).toUpperCase() + category.slice(1)} Commands**:\n`;
			response += names.map((name) => `• !${name}`).join("\n");
			response += "\n\n";
		}

		response +=
			"Type `!help <command>` for more info about a specific command.";

		await message.reply(response);
	} catch (error) {
		console.error("Failed to list commands:", error);
		await message.reply("Oops! Couldn't fetch my command list (´；ω；`)");
	}
}
