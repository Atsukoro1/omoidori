import { generateText } from "ai";
import { openrouter } from "../../lib/openrouter";
import type { Message } from "discord.js";
import { db } from "../../lib/prisma";

export const description = "Creates a permanent note with a content. Usage: !create-note My password to bank account: 1234";

export async function execute(message: Message, args: string[]) {
  if (!args.length) {
    return message.reply("Please include your note content!\nExample: `!note Buy more cat food`");
  }

  const content = args.join(' ').trim();
  
  const note = await db.note.create({
    data: {
      content,
      userId: message.author.id
    }
  });

  const { text: aiResponse } = await generateText({
    model: openrouter("anthropic/claude-3-haiku"),
    system: `You're Omoidori, a cute anime assistant. Create a confirmation message for a new note. Rules:
    - Max 2 sentences
    - Include 1 emoji
    - Reference the note naturally
    - Never mention databases or systems`,
    prompt: `The user just created this note: "${content}"`
  });

  await message.reply(
    `${aiResponse}\n` +
    `(Note ID: ${note.id}...)`
  );
}
