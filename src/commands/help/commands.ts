import type { Message } from "discord.js";
import { commands } from "../index";

export async function execute(message: Message) {
    try {
        const commandGroups: Record<string, Array<{name: string, description?: string}>> = {};

        // biome-ignore lint/complexity/noForEach: Not too complex array
        commands.forEach((cmd) => {
            const [category, name] = cmd.name.split(":");
            if (!commandGroups[category as string]) {
                commandGroups[category as string] = [];
            }
            commandGroups[category as string]?.push({
                name: name as string,
                description: cmd.description
            });
        });

        let response = "Here are my available commands:\n\n";
        for (const [category, cmds] of Object.entries(commandGroups)) {
            response += `**${category.charAt(0).toUpperCase() + category.slice(1)} Commands**:\n`;
            response += cmds.map(cmd => 
                `• \`!${cmd.name}\` - ${cmd.description || 'No description available'}`
            ).join("\n");
            response += "\n\n";
        }

        await message.reply(response);
    } catch (error) {
        console.error("Failed to list commands:", error);
        await message.reply("Oops! Couldn't fetch my command list (´；ω；`)");
    }
}
