import "dotenv/config";
import { aiProcess } from "./lib/ai";
import { handleCommand } from "./commands";
import { discordClient } from "./lib/discordClient";
import { env } from "./lib/env";
import { startReminderCron } from "./crons/reminderCron";

if (!env.DISCORD_TOKEN || !env.OWNER_USER_ID) {
  throw new Error("Missing required environment variables");
}

discordClient.on("ready", async () => {
  console.log(`🌸 ${discordClient.user?.tag} is ready!`);

  startReminderCron();

  try {
    const user = await discordClient.users.fetch(env.OWNER_USER_ID);
    await user.createDM();
    console.log(`Pre-created DM channel with ${user.tag}`);
  } catch (error) {
    console.error("Failed to create DM channel:", error);
  }
});

discordClient.on("messageCreate", async (message) => {
  if (!message.channel.isDMBased() || message.author.bot) return;

  const isCommand = handleCommand(message);
  if (isCommand) return;

  try {
    await message.channel.sendTyping();

    const response = await aiProcess({
        prompt: message.content,
        includeTools: true,
        useMemory: true,
    });

    await message.reply(response);
  } catch (error) {
    console.error("Message handling failed:", error);
    await message.reply("H-hiccup! My circuits glitched... (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)");
  }
});

discordClient.login(env.DISCORD_TOKEN);
