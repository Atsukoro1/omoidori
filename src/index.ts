import "dotenv/config";
import { aiProcess } from "./lib/ai";
import { handleCommand } from "./commands";
import { discordClient } from "./lib/discordClient";
import { env } from "./lib/env";
import { startReminderCron } from "./crons/reminderCron";
import { logger } from "./lib/logger";

if (!env.DISCORD_TOKEN || !env.OWNER_USER_ID) {
  throw new Error("Missing required environment variables");
}

discordClient.on("ready", async () => {
  logger.info({
    tag: discordClient?.user?.tag
  }, "Discord client is ready");

  startReminderCron();

  try {
    const user = await discordClient.users.fetch(env.OWNER_USER_ID);
    await user.createDM();

    logger.info({ targetUser: user?.tag }, "Pre-created DM channel with user");
  } catch (error) {
    logger.error(error, "Failed to pre-create DM channel with target user");
  }
});

discordClient.on("messageCreate", async (message) => {
  if (!message.channel.isDMBased() || message.author.bot) return;

  logger.info({ content: message.content, fromUser: message.author.tag }, "Incoming message from user");

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
    logger.error(error, "Message handling failed");
    await message.reply("H-hiccup! My circuits glitched... (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)");
  }
});

discordClient.login(env.DISCORD_TOKEN);
