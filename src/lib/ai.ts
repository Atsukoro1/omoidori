import { generateText, type CoreMessage } from "ai";
import { db } from "./prisma";
import { openrouter } from "./openrouter";
import { createReminderTool } from "../tools/create-reminder";
import { deleteAllRemindersTool } from "../tools/delete-all-reminders";
import { listAllRemindersTool } from "../tools/list-all-reminders";
import { createNoteTool } from "../tools/create-note";
import { createSystemPrompt } from "../utils/createSystemPrompt";
import { defaultContext } from "../consts/context";
import { MODELS } from "../consts/models";
import { getContextMessages } from "../utils/getContextMessages";
import { saveMessage } from "../utils/saveMessage";

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
		model: openrouter(MODELS.chat_tooling),
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
                create_note: createNoteTool,
			},
		}),
	});

	await saveMessage(text, true);
    
	return text;
}
