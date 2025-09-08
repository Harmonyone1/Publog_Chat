'use client';
import { useState } from 'react';
import { ChatMessage } from '../../../lib/types';
import ChatStream from '../../../components/ChatStream';
import ChatInput from '../../../components/ChatInput';
import { ask } from '../../../lib/api';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: 'assistant',
      content: 'Hi! Ask me about awards, suppliers, NIINs, prices, etc. Example: "Top 10 NIINs by revenue in 2022"',
      createdAt: Date.now(),
    },
  ]);
  const [busy, setBusy] = useState(false);

  async function handleAsk(question: string) {
    setMessages((m) => [...m, { id: uid(), role: 'user', content: question, createdAt: Date.now() }]);
    setBusy(true);
    try {
      const payload = await ask(question, {});
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          content: payload.answer,
          views: payload.views,
          explanation: payload.explanation,
          createdAt: Date.now(),
        },
      ]);
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { id: uid(), role: 'assistant', content: 'Request failed', error: e.message, createdAt: Date.now() },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <ChatStream messages={messages} />
      <div className="mt-4">
        <ChatInput onSend={handleAsk} disabled={busy} />
      </div>
    </div>
  );
}
