export const isQuestion = (text: string): boolean => {
    const questionWords = ['what', 'why', 'how', 'when', 'who', 'which', '?'];
    return questionWords.some(word => text.toLowerCase().includes(word));
};

export const requiresFollowup = (text: string): boolean => {
    const followupPhrases = ['remember', 'recall', 'know', 'think about', 'my favorite'];
    return followupPhrases.some(phrase => text.toLowerCase().includes(phrase));
};

export const enhanceMessageForStorage = (text: string): string => {
    let enhanced = text;
    if (isQuestion(text)) enhanced += " [QUESTION]";
    if (requiresFollowup(text)) enhanced += " [FOLLOWUP]";
    return enhanced;
};