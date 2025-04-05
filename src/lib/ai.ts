import { generateText, type CoreMessage } from "ai";
import { db } from "./prisma";
import { openrouter } from "./openrouter";
import { createReminderTool } from "../tools/createReminder";
import { deleteAllRemindersTool } from "../tools/deleteAllReminders";
import { listAllRemindersTool } from "../tools/listAllReminders";
import { createNoteTool } from "../tools/createNote";
import { createSystemPrompt } from "../utils/createSystemPrompt";
import { defaultContext } from "../consts/context";
import { MODELS } from "../consts/models";
import { getContextMessages } from "../utils/getContextMessages";
import { saveMessage } from "../utils/saveMessage";
import { listAllNotesTool } from "../tools/listAllNotes";
import { deleteNoteTool } from "../tools/deleteNote";

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

	let responseText = "";

	const { text, toolResults } = await generateText({
		model: openrouter(MODELS.chat_tooling),
		system: systemPrompt,
		temperature: 0.7,
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
				list_all_notes: listAllNotesTool,
				delete_note: deleteNoteTool,
			},
		}),
	});

	responseText = `${text}${toolResults[0] ? "\n\n".concat(toolResults[0]?.result.result ?? "") : ""} `;

	await saveMessage(responseText, true);

	return responseText;
}
