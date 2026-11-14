import { CheckCheck, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Message } from "../types/message.ts";
import { formatRelativeTime, formatTime } from "../utils/formatTime.ts";
import { findUrl, isImageUrl, linkify } from "../utils/linkify.tsx";
import LinkPreview from "./LinkPreview.tsx";

const MessageBody = ({ text }: { text: string }) => {
  if (isImageUrl(text)) {
    return <img src={text} alt="GIF" className="mt-1 max-h-48 rounded" />;
  }

  const url = findUrl(text);
  return (
    <>
      <p className="wrap-break-word whitespace-pre-wrap">{linkify(text)}</p>
      {url && <LinkPreview url={url} />}
    </>
  );
};

type Props = {
  message: Message;
  isOwn: boolean;
  isSeen: boolean;
  now: number;
  onEdit: (id: string, text: string) => boolean;
  onDelete: (id: string) => boolean;
};

const MessageItem = ({
  message,
  isOwn,
  isSeen,
  now,
  onEdit,
  onDelete,
}: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      editRef.current?.focus();
    }
  }, [isEditing]);

  const isDeleted = message.deletedAt !== undefined;
  const canChange = isOwn && !isDeleted && !isEditing;

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
        <p className="min-w-0 truncate font-semibold">{message.userName}</p>
        <div className="flex shrink-0 items-center gap-2 text-sm whitespace-nowrap text-neutral-600">
          {canChange && (
            <button
              type="button"
              aria-label="Edit message"
              onClick={startEditing}
              className="p-1 opacity-0 group-hover:opacity-100 hover:text-neutral-900 focus:opacity-100 active:scale-90 pointer-coarse:opacity-100"
            >
              <Pencil className="size-4" />
            </button>
          )}
          {canChange && (
            <button
              type="button"
              aria-label="Delete message"
              onClick={() => onDelete(message.id)}
              className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-600 focus:opacity-100 active:scale-90 pointer-coarse:opacity-100"
            >
              <Trash2 className="size-4" />
            </button>
          )}
          {message.editedAt !== undefined && !isDeleted && (
            <span>(edited)</span>
          )}
          <time title={formatTime(message.createdAt)}>
            {formatRelativeTime(message.createdAt, now)}
          </time>
          {isSeen && (
            <CheckCheck aria-label="Seen" className="size-4 text-blue-600" />
          )}
        </div>
      </div>

      {isEditing && (
        <input
          ref={editRef}
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
      {isDeleted && <p className="italic text-neutral-500">Message deleted</p>}
      {!isDeleted && !isEditing && <MessageBody text={message.text} />}
    </li>
  );
};

export default MessageItem;
