import { AnswerPayload } from './types';
import { normalizeAnswer } from './adapters';

export async function ask(question: string, userContext: Record<string, any> = {}): Promise<AnswerPayload> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, userContext, resultFormat: 'semantic-v1' }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }
    const json = await res.json();
    return normalizeAnswer(json);
  } finally {
    clearTimeout(timer);
  }
}
