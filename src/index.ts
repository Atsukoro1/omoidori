import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import { aiProcess } from "./lib/ai";
import { handleCommand } from "./commands";
import { discordClient } from "./lib/discordClient";
import { startReminderCron } from "./lib/scheduler";

const { DISCORD_TOKEN, OWNER_USER_ID } = process.env;

if (!DISCORD_TOKEN || !OWNER_USER_ID) {
  throw new Error("Missing required environment variables");
}

discordClient.on("ready", async () => {
  console.log(`🌸 ${discordClient.user?.tag} is ready!`);

  startReminderCron();

  try {
    const user = await discordClient.users.fetch(OWNER_USER_ID);
    await user.createDM();
    console.log(`Pre-created DM channel with ${user.tag}`);
  } catch (error) {
    console.error("Failed to create DM channel:", error);
  }
});

discordClient.on("messageCreate", async (message) => {
  if (!message.channel.isDMBased() || message.author.bot) return;

  // Try to handle as command first
  const isCommand = handleCommand(message);
  if (isCommand) return;

  // Otherwise process as normal message
  try {
    await message.channel.sendTyping();
    const response = await aiProcess(message.content);
    await message.reply(response);
  } catch (error) {
    console.error("Message handling failed:", error);
    await message.reply("H-hiccup! My circuits glitched... (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)");
  }
});

discordClient.login(process.env.DISCORD_TOKEN);
