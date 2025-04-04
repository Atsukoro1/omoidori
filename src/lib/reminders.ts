import { aiProcess } from "./ai";

export async function generateReminderMessage(content: string) {
	return aiProcess(`Create friendly reminder text for: "${content}"`);
}
