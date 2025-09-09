import { AskResponse } from './types';

export async function ask(question: string): Promise<AskResponse> {
  const payload = { question };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      console.log('API status', res.status);
      const text = await res.text();
      console.log('API raw response', text);
      if (!res.ok) {
        throw new Error(`Request failed with ${res.status}`);
      }
      let json: any;
      try {
        json = JSON.parse(text);
      } catch (err) {
        console.error('Failed to parse response:', text);
        throw err;
      }
      const body = typeof json.body === 'string' ? JSON.parse(json.body) : json.body ?? json;
      return body as AskResponse;
    } catch (err) {
      if (attempt === 2) throw err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw new Error('Failed to fetch');
}
