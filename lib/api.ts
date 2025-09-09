import { AskResponse } from './types';

export async function ask(question: string): Promise<AskResponse> {
  const payload = { question };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      const data = await res.json();
      const body = typeof data === 'object' && data && 'body' in data ? JSON.parse((data as any).body) : data;
      return body as AskResponse;
    } catch (err) {
      if (attempt === 2) throw err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw new Error('Failed to fetch');
}
