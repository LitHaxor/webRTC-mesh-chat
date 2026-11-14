import { ArrowDown, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatEvent, RoomEvent } from "../types/events.ts";
import { formatRelativeTime, formatTime } from "../utils/formatTime.ts";
import { mountTable, tableTour } from "../anims/table.ts";
import Hairline from "../anims/Hairline.tsx";
import MessageItem from "./MessageItem.tsx";

const BOTTOM_THRESHOLD_PX = 40;

type Props = {
  events: (ChatEvent | RoomEvent)[];
  userId: string;
  seenId: string | null;
  onEdit: (id: string, text: string) => boolean;
  onDelete: (id: string) => boolean;
};

const MessageList = ({ events, userId, seenId, onEdit, onDelete }: Props) => {
  const [now, setNow] = useState(() => Date.now());
  const [isAtBottom, setIsAtBottom] = useState(true);

  const listRef = useRef<HTMLUListElement>(null);
  const hasMessages = events.some((event) => "payload" in event);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list || !isAtBottom) {
      return;
    }
    const observer = new ResizeObserver(() =>
      list.scrollTo({ top: list.scrollHeight, behavior: "instant" }),
    );
    for (const item of list.children) {
      observer.observe(item);
    }
    return () => observer.disconnect();
  }, [events, isAtBottom]);

  const updateIsAtBottom = () => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    const distance = list.scrollHeight - list.scrollTop - list.clientHeight;
    setIsAtBottom(distance < BOTTOM_THRESHOLD_PX);
  };

  const scrollToBottom = () => {
    const list = listRef.current;
    list?.scrollTo({ top: list.scrollHeight });
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <ul
        ref={listRef}
        onScroll={updateIsAtBottom}
        className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-4 motion-safe:scroll-smooth"
      >
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
            <li
              key={index}
              className="flex items-center gap-2 text-neutral-600"
            >
              <Info className="size-4" />
              <span className="flex-1 italic">
                {event.userName} {event.type}
              </span>
              <time
                title={formatTime(event.createdAt)}
                className="shrink-0 text-sm whitespace-nowrap"
              >
                {formatRelativeTime(event.createdAt, now)}
              </time>
            </li>
          );
        })}
        {!hasMessages && (
          <li className="m-auto flex flex-col items-center gap-2 text-center text-neutral-500">
            <Hairline
              mount={mountTable}
              stops={tableTour}
              value={14}
              label="A round table with every seat empty"
            />
            <p className="font-semibold text-neutral-600">No messages yet</p>
            <p className="text-sm">Say hello to start the conversation.</p>
          </li>
        )}
      </ul>
      {!isAtBottom && (
        <button
          type="button"
          aria-label="Scroll to the newest message"
          onClick={scrollToBottom}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-neutral-200 bg-white p-2 text-blue-600 shadow-md hover:bg-neutral-50 active:scale-90"
        >
          <ArrowDown className="size-5" />
        </button>
      )}
    </div>
  );
};

export default MessageList;
