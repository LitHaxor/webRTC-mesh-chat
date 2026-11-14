import { ArrowDown, Info } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ChatEvent, RoomEvent } from "../types/events.ts";
import { formatRelativeTime, formatTime } from "../utils/formatTime.ts";
import { mountTable, tableTour } from "../anims/table.ts";
import Hairline from "../anims/Hairline.tsx";
import MessageItem from "./MessageItem.tsx";

const BOTTOM_THRESHOLD_PX = 40;
const ROW_HEIGHT_GUESS_PX = 56;
const ROW_GAP_PX = 24;
const ROWS_KEPT_OFFSCREEN = 8;

const keyOf = (event: ChatEvent | RoomEvent, index: number) => {
  if ("payload" in event) {
    return event.payload.message.id;
  }
  return index;
};

type Props = {
  events: (ChatEvent | RoomEvent)[];
  userId: string;
  seenId: string | null;
  sendingIds: string[];
  onEdit: (id: string, text: string) => boolean;
  onDelete: (id: string) => boolean;
};

const MessageList = ({
  events,
  userId,
  seenId,
  sendingIds,
  onEdit,
  onDelete,
}: Props) => {
  const [now, setNow] = useState(() => Date.now());
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const hasMessages = events.some((event) => "payload" in event);

  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_GUESS_PX,
    getItemKey: (index) => keyOf(events[index], index),
    gap: ROW_GAP_PX,
    overscan: ROWS_KEPT_OFFSCREEN,
  });
  const rows = virtualizer.getVirtualItems();
  const totalHeight = virtualizer.getTotalSize();
  const viewportHeight = virtualizer.scrollRect?.height ?? 0;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || !isAtBottom) {
      return;
    }
    scroller.scrollTo({ top: scroller.scrollHeight });
  }, [isAtBottom, totalHeight, viewportHeight, events.length]);

  const updateIsAtBottom = () => {
    const scroller = scrollRef.current;
    if (!scroller) {
      return;
    }
    const distance =
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    setIsAtBottom(distance < BOTTOM_THRESHOLD_PX);
  };

  const renderEvent = (event: ChatEvent | RoomEvent) => {
    if ("payload" in event) {
      const { message } = event.payload;
      return (
        <MessageItem
          message={message}
          isOwn={message.userId === userId}
          isSeen={message.id === seenId}
          isSending={sendingIds.includes(message.id)}
          now={now}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );
    }

    return (
      <div className="flex items-center gap-2 text-neutral-600">
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
      </div>
    );
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={updateIsAtBottom}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-4"
      >
        <ul className="relative shrink-0" style={{ height: totalHeight }}>
          {rows.map((row) => (
            <li
              key={row.key}
              ref={virtualizer.measureElement}
              data-index={row.index}
              className="absolute top-0 left-0 w-full"
              style={{ transform: `translateY(${row.start}px)` }}
            >
              {renderEvent(events[row.index])}
            </li>
          ))}
        </ul>
        {!hasMessages && (
          <div className="m-auto flex flex-col items-center gap-2 text-center text-neutral-500">
            <Hairline mount={mountTable} stops={tableTour} value={14} />
            <p className="font-semibold text-neutral-600">No messages yet</p>
            <p className="text-sm">Say hello to start the conversation.</p>
          </div>
        )}
      </div>
      {!isAtBottom && (
        <button
          type="button"
          aria-label="Scroll to the newest message"
          onClick={() => setIsAtBottom(true)}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-neutral-200 bg-white p-2 text-blue-600 shadow-md hover:bg-neutral-50 active:scale-90"
        >
          <ArrowDown className="size-5" />
        </button>
      )}
    </div>
  );
};

export default MessageList;
