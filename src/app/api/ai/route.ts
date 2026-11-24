import { NextResponse } from 'next/server';

const PRIMARY_MODEL = 'meta-llama/llama-3.2-3b-instruct:free';
const FALLBACK_MODEL = 'qwen/qwen-2-7b-instruct:free';

type TaskType = 'improve' | 'generate' | 'summarize' | 'expand' | 'fix' | 'ask';

// Cheap in-memory abuse guard: 20 AI calls per minute per client IP.
// (Single-instance dev/small-deploy guard, not a distributed limiter.)
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const MAX_PROMPT_CHARS = 8000;
const hits = new Map<string, number[]>();

function clientKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return (forwarded?.split(',')[0]?.trim() || 'local').slice(0, 64);
}

function isRateLimited(req: Request): boolean {
  const key = clientKey(req);
  const now = Date.now();
  const window = (hits.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (window.length >= RATE_LIMIT) {
    hits.set(key, window);
    return true;
  }
  window.push(now);
  hits.set(key, window);
  return false;
}

function getSystemPrompt(task: TaskType, context?: string, prompt?: string): string {
  switch (task) {
    case 'improve':
      return 'You are a STEM capstone writing assistant. Improve the following text for clarity, academic tone, and grammar. Keep meaning. Return only improved text.';
    case 'generate':
      return `You are a STEM capstone assistant. Generate content for: ${context || 'general'} based on: ${prompt || ''}`;
    case 'summarize':
      return 'Summarize the following research/content concisely:';
    case 'expand':
      return 'Expand the following with more detail and examples:';
    case 'fix':
      return 'Fix grammar and clarity:';
    case 'ask':
      return 'You are a STEM capstone assistant. Answer ONLY from the project sources provided in the context, and name the source file(s) you used. If the answer is not in the sources, reply exactly: "I couldn\'t find that in your project files." Never invent facts, measurements, references, or deadlines.';
    default:
      return 'You are a helpful STEM capstone writing assistant.';
  }
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string
) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'STEM Capstone Hub',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    // Truncate provider errors: never echo unbounded upstream bodies to clients
    const errText = (await res.text()).slice(0, 300);
    throw new Error(`OpenRouter error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content returned from OpenRouter');
  }
  return content as string;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY is not configured' }, { status: 500 });
    }

    if (isRateLimited(req)) {
      return NextResponse.json({ error: 'Too many AI requests. Please wait a minute and try again.' }, { status: 429 });
    }

    const body = await req.json();
    const { prompt, task, context } = body as { prompt: string; task: TaskType; context?: string };

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }
    if (prompt.length > MAX_PROMPT_CHARS) {
      return NextResponse.json({ error: `Prompt is too long (max ${MAX_PROMPT_CHARS} characters).` }, { status: 400 });
    }

    if (!task || !['improve', 'generate', 'summarize', 'expand', 'fix', 'ask'].includes(task)) {
      return NextResponse.json({ error: 'invalid task' }, { status: 400 });
    }

    const cleanContext = typeof context === 'string' ? context.slice(0, 500) : undefined;
    const systemPrompt = getSystemPrompt(task as TaskType, cleanContext, prompt);

    try {
      const result = await callOpenRouter(apiKey, PRIMARY_MODEL, systemPrompt, prompt);
      return NextResponse.json({ result });
    } catch (primaryError) {
      console.error('Primary model failed, retrying with fallback:', primaryError);

      try {
        const fallbackResult = await callOpenRouter(apiKey, FALLBACK_MODEL, systemPrompt, prompt);
        return NextResponse.json({ result: fallbackResult });
      } catch (fallbackError) {
        console.error('Fallback model also failed:', fallbackError);
        const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        // If the model doesn't support images, give a clear message
        if (fallbackMsg.toLowerCase().includes('does not support image')) {
          return NextResponse.json({ error: 'This AI model does not support images. Please provide text only.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'AI request failed. Please try again later.' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('AI route error:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    // Differentiate model errors from server errors
    if (errMsg.toLowerCase().includes('does not support image') || errMsg.toLowerCase().includes('cannot read image')) {
      return NextResponse.json({ error: 'This AI model does not support images. Please provide text only.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
