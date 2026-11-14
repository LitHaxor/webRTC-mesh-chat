import { Pencil } from "lucide-react";
import { useState } from "react";
import type { Message } from "../types/message.ts";
import { formatRelativeTime, formatTime } from "../utils/formatTime.ts";
import { linkify } from "../utils/linkify.tsx";

type Props = {
  message: Message;
  isOwn: boolean;
  now: number;
  onEdit: (id: string, text: string) => boolean;
};

const MessageItem = ({ message, isOwn, now, onEdit }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);

  const startEditing = () => {
    setDraft(message.text);
    setIsEditing(true);
  };

  const save = () => {
    const text = draft.trim();
    if (!text || text === message.text) {
      setIsEditing(false);
      return;
    }
    if (onEdit(message.id, text)) {
      setIsEditing(false);
    }
  };

  return (
    <li className="group">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-semibold">{message.userName}</p>
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          {isOwn && !isEditing && (
            <button
              type="button"
              aria-label="Edit message"
              onClick={startEditing}
              className="opacity-0 group-hover:opacity-100 hover:text-neutral-900 focus:opacity-100"
            >
              <Pencil className="size-4" />
            </button>
          )}
          {message.editedAt !== undefined && <span>(edited)</span>}
          <time title={formatTime(message.createdAt)}>
            {formatRelativeTime(message.createdAt, now)}
          </time>
        </div>
      </div>

      {isEditing && (
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
            if (event.key === "Escape") setIsEditing(false);
          }}
          aria-label="Edit message"
          className="mt-1 w-full rounded border border-blue-600 px-2 py-1 outline-none"
        />
      )}
      {!isEditing && (
        <p className="wrap-break-word whitespace-pre-wrap">
          {linkify(message.text)}
        </p>
      )}
    </li>
  );
};

export default MessageItem;
