import { db } from "../../lib/prisma";
import type { Message } from "discord.js";

export const description = "Shows your last 10 context summaries";

export async function execute(message: Message) {
  try {
    const summaries = await db.contextSummary.findMany({
      orderBy: { createdAt: "desc" },
      take: 10 // Last 10 summaries
    });

    if (summaries.length === 0) {
      return message.reply("No context summaries found yet!");
    }

    const summaryText = summaries
      .map((s, i) => `**Summary ${i+1}**\n${s.summary}`)
      .join("\n\n");

    return message.reply(`Here are your context summaries:\n\n${summaryText}`);
  } catch (error) {
    console.error("Failed to fetch summaries:", error);
    return message.reply("Failed to get summaries. Sorry! (´；ω；`)");
  }
}
