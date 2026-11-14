import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import type { ChatEvent, RoomEvent } from "../types/events.ts";
import { formatRelativeTime, formatTime } from "../utils/formatTime.ts";
import { linkify } from "../utils/linkify.tsx";

type Props = {
  events: (ChatEvent | RoomEvent)[];
};

const MessageList = ({ events }: Props) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-4">
      {events.map((event, index) =>
        "payload" in event ? (
          <li key={event.payload.message.id}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-semibold">{event.payload.message.userName}</p>
              <time
                title={formatTime(event.payload.message.createdAt)}
                className="text-sm text-neutral-600"
              >
                {formatRelativeTime(event.payload.message.createdAt, now)}
              </time>
            </div>
            <p className="wrap-break-word whitespace-pre-wrap">
              {linkify(event.payload.message.text)}
            </p>
          </li>
        ) : (
          <li key={index} className="flex items-center gap-2 text-neutral-600">
            <Info className="size-4" />
            <span className="flex-1 italic">
              {event.userName} {event.type}
            </span>
            <time title={formatTime(event.createdAt)} className="text-sm">
              {formatRelativeTime(event.createdAt, now)}
            </time>
          </li>
        ),
      )}
    </ul>
  );
};

export default MessageList;
