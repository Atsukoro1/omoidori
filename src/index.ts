import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import { aiProcess } from "./lib/ai";
import { handleCommand } from "./commands";

const { DISCORD_TOKEN, OWNER_USER_ID } = process.env;

if (!DISCORD_TOKEN || !OWNER_USER_ID) {
  throw new Error("Missing required environment variables");
}

const client = new Client({
  intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent],
});

client.on("ready", async () => {
  console.log(`🌸 ${client.user?.tag} is ready!`);

  try {
    const user = await client.users.fetch(OWNER_USER_ID);
    await user.createDM();
    console.log(`Pre-created DM channel with ${user.tag}`);
  } catch (error) {
    console.error("Failed to create DM channel:", error);
  }
});

client.on("messageCreate", async (message) => {
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

client.login(process.env.DISCORD_TOKEN);
