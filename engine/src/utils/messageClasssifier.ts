import { generateText } from "ai";
import { openrouter } from "../lib/openrouter";
import { MODELS } from "../consts/models";

export async function classifyMessage(text: string): Promise<{
  isQuestion: boolean;
  isFact: boolean;
  requiresFollowup: boolean;
}> {
  const { text: classification } = await generateText({
    model: openrouter(MODELS.classifier),
    temperature: 0,
    maxTokens: 50,
    messages: [{
      role: "user",
      content: `Classify this message in JSON format. Return ONLY JSON:
      
      Message: "${text}"

      Analyze if it:
      1. isQuestion - is a direct question
      2. isFact - states a fact or personal information
      3. requiresFollowup - will likely need future reference

      Example response: {"isQuestion":false,"isFact":true,"requiresFollowup":true}

      Your classification:`
    }]
  });

  try {
    return JSON.parse(classification.trim());
  } catch {
    const isQuestion = /^(what|why|how|when|who|which|where|can|could|would|will|do|does|did|have|has|is|are|am|'s|'re|'d|\?)/i.test(text);
    const isFact = /^(my|i (have|love|like|prefer|enjoy|adore|dislike|hate))|.* (is|are|was|were) (my|our|his|her|their)?\s+/i.test(text);
    const requiresFollowup = /(remember|recall|know|think about|my (favorite|preferred)|(always|never) (like|love|hate|use|play|watch))/i.test(text);

    return {
      isQuestion,
      isFact,
      requiresFollowup,
    };
}
}