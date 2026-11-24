export interface MeetingSummary {
  keyDecisions: string[];
  actionItems: string[];
  topicsDiscussed: string[];
  followUpItems: string[];
}

const DECISION_PATTERNS = [
  /(?:decided to|decided that)\s+(.+?)(?:\.|$)/gi,
  /(?:agreed on|agreed to)\s+(.+?)(?:\.|$)/gi,
  /(?:we will|we'll)\s+(.+?)(?:\.|$)/gi,
  /(?:approved|approve)\s+(.+?)(?:\.|$)/gi,
  /(?:chose|chosen)\s+(.+?)(?:\.|$)/gi,
  /(?:selected)\s+(.+?)(?:\.|$)/gi,
];

const ACTION_PATTERNS = [
  /^TODO:\s*(.+)$/gim,
  /^ACTION:\s*(.+)$/gim,
  /(?:need to|needs to)\s+(.+?)(?:\.|$)/gi,
  /(?:should)\s+(.+?)(?:\.|$)/gi,
  /(?:must)\s+(.+?)(?:\.|$)/gi,
  /(?:will follow up|follow up on)\s+(.+?)(?:\.|$)/gi,
  /(?:assigned to)\s+(.+?)(?:\.|$)/gi,
];

const FOLLOWUP_PATTERNS = [
  /(?:follow up|follow-up)\s+(?:on|with|regarding)\s+(.+?)(?:\.|$)/gi,
  /(?:next meeting)\s*[:,]?\s*(.+?)(?:\.|$)/gi,
  /(?:check with)\s+(.+?)(?:\.|$)/gi,
  /(?:schedule|reschedule)\s+(.+?)(?:\.|$)/gi,
  /(?:before next time)\s*[:,]?\s*(.+?)(?:\.|$)/gi,
];

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
  'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'our',
  'you', 'your', 'i', 'me', 'my', 'he', 'him', 'his', 'she', 'her',
  'not', 'no', 'nor', 'as', 'if', 'then', 'than', 'too', 'very',
  'just', 'about', 'above', 'after', 'again', 'all', 'also', 'any',
  'because', 'before', 'between', 'both', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'into', 'only', 'own', 'same',
  'so', 'still', 'when', 'where', 'which', 'while', 'who', 'whom',
  'what', 'how', 'here', 'there', 'up', 'out', 'off', 'over',
]);

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 3);
}

function extractMatches(text: string, patterns: RegExp[]): string[] {
  const results: string[] = [];
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        const cleaned = match[1].trim().replace(/[,;:]+$/, '');
        if (cleaned.length > 2) {
          results.push(cleaned);
        }
      }
    }
  }
  return [...new Set(results)];
}

function extractTopics(sentences: string[]): string[] {
  const wordCounts = new Map<string, number>();

  for (const sentence of sentences) {
    const words = sentence.toLowerCase().match(/[a-z]{3,}/g) || [];
    const seen = new Set<string>();
    for (const word of words) {
      if (!STOP_WORDS.has(word) && !seen.has(word)) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        seen.add(word);
      }
    }
  }

  const sorted = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

  return sorted.length > 0 ? sorted : ['General Discussion'];
}

export function autoSummarize(notes: string, agenda: string): MeetingSummary {
  const combined = [notes, agenda].filter(Boolean).join('. ');
  const sentences = splitSentences(combined);

  const keyDecisions = extractMatches(combined, DECISION_PATTERNS);
  const actionItems = extractMatches(combined, ACTION_PATTERNS);
  const followUpItems = extractMatches(combined, FOLLOWUP_PATTERNS);
  const topicsDiscussed = extractTopics(sentences);

  return {
    keyDecisions: keyDecisions.length > 0 ? keyDecisions : ['No key decisions recorded'],
    actionItems: actionItems.length > 0 ? actionItems : ['No action items identified'],
    topicsDiscussed,
    followUpItems: followUpItems.length > 0 ? followUpItems : ['No follow-up items'],
  };
}
