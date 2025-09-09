'use client';
import { useState } from 'react';
import { ChatMessage, AskResponse } from '../../../lib/types';
import MessageList from '../../../components/MessageList';
import ChatComposer from '../../../components/ChatComposer';
import ViewsRenderer from '../../../components/views/ViewsRenderer';
import { ask } from '../../../lib/api';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: 'assistant',
      content:
        'Hi! Ask me about awards, suppliers, NIINs, prices, etc. Example: "Top 10 NIINs by revenue in 2022"',
      createdAt: Date.now(),
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [lastData, setLastData] = useState<AskResponse | null>(null);

  async function handleAsk(question: string) {
    setMessages((m) => [...m, { id: uid(), role: 'user', content: question, createdAt: Date.now() }]);
    setBusy(true);
    try {
      const resp = await ask(question);
      if ((resp as any).error) {
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: 'assistant',
            content: 'Request failed',
            error: (resp as any).error,
            createdAt: Date.now(),
          },
        ]);
        setLastData(null);
      } else if (resp.mode === 'chat') {
        setMessages((m) => [
          ...m,
          { id: uid(), role: 'assistant', content: resp.answer, createdAt: Date.now() },
        ]);
        setLastData(null);
      } else if (resp.mode === 'sql') {
        setMessages((m) => [
          ...m,
          { id: uid(), role: 'assistant', content: 'Here are the results.', createdAt: Date.now() },
        ]);
        setLastData(resp);
      } else {
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: 'assistant',
            content: 'Unexpected response',
            error: JSON.stringify(resp),
            createdAt: Date.now(),
          },
        ]);
        setLastData(null);
      }
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
      <MessageList messages={messages} />
      <ViewsRenderer data={lastData} />
      <div className="mt-4">
        <ChatComposer onSend={handleAsk} disabled={busy} />
      </div>
    </div>
  );
}
