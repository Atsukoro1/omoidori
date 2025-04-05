import { generateText, type CoreMessage, type Tool } from "ai";
import { getContextMessages, saveMessage } from "./memory";
import { db } from "./prisma";
import { defaultContext, createSystemPrompt } from "./context";
import { openrouter } from "./openrouter";
import { createReminderTool } from "../tools/create-reminder";
import { deleteAllRemindersTool } from "../tools/delete-all-reminders";
import { listAllRemindersTool } from "../tools/list-all-reminders";

interface AiProcessProps {
	prompt: string;
	includeMessageHistory?: boolean;
	includeTools?: boolean;
}

export async function aiProcess({
	prompt,
	includeMessageHistory,
	includeTools,
}: AiProcessProps) {
	const [contextSummary, messages] = await Promise.all([
		db.contextSummary.findFirst({ orderBy: { createdAt: "desc" } }),
		getContextMessages(),
	]);

	const systemPrompt = [
		createSystemPrompt(defaultContext),
		contextSummary?.summary ? `User Context:\n${contextSummary.summary}` : "",
	].join("\n\n");

	const { text } = await generateText({
		model: openrouter("anthropic/claude-3.7-sonnet"),
		system: systemPrompt,
		messages: [
			...(includeMessageHistory ? (messages as CoreMessage[]) : []),
			{ role: "user", content: prompt },
		],
		...(includeTools && {
			tools: {
				create_reminder: createReminderTool,
				delete_all_reminders: deleteAllRemindersTool,
				list_all_reminders: listAllRemindersTool,
			},
		}),
	});

	await saveMessage(text, true);
	return text;
}
