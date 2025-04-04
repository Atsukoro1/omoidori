import { generateText } from "ai";
import { db } from "./prisma";
import { openrouter } from "./openrouter";

const MAX_CONTEXT = 20;
const SUMMARY_INTERVAL = 15; // Messages between summaries
const CHEAP_MODEL = 'mistralai/mistral-7b-instruct';

export async function getContextMessages() {
	const messages = await db.messageHistory.findMany({
		where: { context: true },
		orderBy: { createdAt: "asc" },
		take: MAX_CONTEXT,
	});

	// Rotate oldest message out of context
	if (messages.length >= MAX_CONTEXT) {
		const oldest = messages[0];
		await db.messageHistory.update({
			where: { id: oldest?.id },
			data: { context: false },
		});
	}

	return messages.map((m) => ({
		role: m.isBot ? "assistant" : ("user" as const),
		content: m.content,
	}));
}

export async function checkForSummary() {
  const messageCount = await db.messageHistory.count();
  
  if (messageCount > 0 && messageCount % SUMMARY_INTERVAL === 0) {
    const lastMessages = await db.messageHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: SUMMARY_INTERVAL,
    });
    
    const conversation = lastMessages
      .reverse()
      .map(m => `${m.isBot ? 'Assistant' : 'User'}: ${m.content}`)
      .join('\n');

    const currentContext = await db.contextSummary.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const summaryPrompt = [
      "Current context (if any):",
      currentContext?.summary || "No existing context",
      "New messages:",
      conversation,
      "Create a concise 3-sentence summary updating the context. Focus on:",
      "- Key preferences/habits - Ongoing projects - Emotional state trends"
    ].join('\n');

    const { text: newSummary } = await generateText({
      model: openrouter(CHEAP_MODEL),
      prompt: summaryPrompt,
      maxTokens: 300,
      temperature: 0.3
    });

    await db.contextSummary.create({
      data: { summary: newSummary }
    });
  }
}

// Update saveMessage to trigger checks
export async function saveMessage(content: string, isBot: boolean) {
  const message = await db.messageHistory.create({ data: { content, isBot } });
  await checkForSummary();
  return message;
}
