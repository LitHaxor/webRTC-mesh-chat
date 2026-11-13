import { useState } from "react";

type Props = {
  onSend: (text: string) => boolean;
};

const MessageForm = ({ onSend }: Props) => {
  const [draft, setDraft] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (draft.trim() && onSend(draft)) setDraft("");
      }}
      className="m-3 flex flex-col gap-3 rounded border border-neutral-300 p-3 focus-within:border-blue-600"
    >
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Write to everyone"
        className="outline-none placeholder:text-neutral-500"
      />
      <button
        type="submit"
        aria-label="Send"
        className="self-end text-neutral-600 hover:text-neutral-900"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
          <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </form>
  );
};

export default MessageForm;
