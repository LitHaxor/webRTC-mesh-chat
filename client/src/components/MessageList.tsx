import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import type { ChatEvent, RoomEvent } from "../types/events.ts";
import { formatRelativeTime, formatTime } from "../utils/formatTime.ts";
import MessageItem from "./MessageItem.tsx";

type Props = {
  events: (ChatEvent | RoomEvent)[];
  userId: string;
  seenId: string | null;
  onEdit: (id: string, text: string) => boolean;
  onDelete: (id: string) => boolean;
};

const MessageList = ({ events, userId, seenId, onEdit, onDelete }: Props) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-4">
      {events.map((event, index) => {
        if ("payload" in event) {
          const { message } = event.payload;
          return (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={message.userId === userId}
              isSeen={message.id === seenId}
              now={now}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          );
        }

        return (
          <li key={index} className="flex items-center gap-2 text-neutral-600">
            <Info className="size-4" />
            <span className="flex-1 italic">
              {event.userName} {event.type}
            </span>
            <time title={formatTime(event.createdAt)} className="text-sm">
              {formatRelativeTime(event.createdAt, now)}
            </time>
          </li>
        );
      })}
    </ul>
  );
};

export default MessageList;
