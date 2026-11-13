import { Info } from "lucide-react";
import type { ChatEvent, RoomEvent } from "../types/events.ts";

type Props = {
  events: (ChatEvent | RoomEvent)[];
};

const MessageList = ({ events }: Props) => {
  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-4">
      {events.map((event, index) =>
        "payload" in event ? (
          <li key={event.payload.message.id}>
            <p className="font-semibold">{event.payload.message.userName}</p>
            <p className="wrap-break-word whitespace-pre-wrap">
              {event.payload.message.text}
            </p>
          </li>
        ) : (
          <li key={index} className="flex items-center gap-2 italic text-neutral-600">
            <Info className="size-4" />
            {event.userName} {event.type}
          </li>
        ),
      )}
    </ul>
  );
};

export default MessageList;
