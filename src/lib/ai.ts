export async function callAI(prompt: string, task: string, context?: string): Promise<string> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, task, context }),
  });

  const data = await res.json();

  if (!res.ok) {
    const errMsg = data?.error || 'AI request failed';
    // Give clear message for image-unsupported models
    if (errMsg.toLowerCase().includes('does not support image') || errMsg.toLowerCase().includes('cannot read image')) {
      throw new Error('This AI model does not support images. Please provide text only.');
    }
    throw new Error(errMsg);
  }

  if (!data.result) {
    throw new Error('No result returned from AI');
  }
  return data.result as string;
}

export function improveText(text: string): Promise<string> {
  return callAI(text, 'improve');
}

export function generateSection(section: string, context: string): Promise<string> {
  return callAI(context, 'generate', section);
}

export function summarizeText(text: string): Promise<string> {
  return callAI(text, 'summarize');
}

export function expandText(text: string): Promise<string> {
  return callAI(text, 'expand');
}

export function fixText(text: string): Promise<string> {
  return callAI(text, 'fix');
}

export function askDocs(question: string, sources: string): Promise<string> {
  return callAI(question, 'ask', sources);
}
