import { SendHorizontal } from "lucide-react";
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
        <SendHorizontal className="size-6" />
      </button>
    </form>
  );
};

export default MessageForm;
