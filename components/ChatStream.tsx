import { ChatMessage } from '../lib/types';
import MessageItem from './MessageItem';

export default function ChatStream({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="flex flex-col gap-4 overflow-y-auto flex-1">
      {messages.map(m => (
        <MessageItem key={m.id} m={m} />
      ))}
    </div>
  );
}
