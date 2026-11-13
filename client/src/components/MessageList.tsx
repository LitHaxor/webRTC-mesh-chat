import type { Message } from "../chat/message.ts";

type Props = {
  messages: Message[];
};

const MessageList = ({ messages }: Props) => {
  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-4">
      {messages.map((message, index) => (
        <li key={index}>
          <p className="font-semibold">{message.name}</p>
          <p className="wrap-break-word whitespace-pre-wrap">{message.text}</p>
        </li>
      ))}
    </ul>
  );
};

export default MessageList;
