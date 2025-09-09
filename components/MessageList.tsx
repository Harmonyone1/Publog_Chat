import { ChatMessage } from '../lib/types';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="flex flex-col gap-4 overflow-y-auto flex-1">
      {messages.map((m) => (
        <MessageBubble key={m.id} m={m} />
      ))}
    </div>
  );
}
