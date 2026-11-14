import { Plus, SendHorizontal, Smile } from "lucide-react";
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
      className="m-3 flex flex-col gap-4 rounded border border-neutral-300 p-3 focus-within:border-blue-600"
    >
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Write to everyone"
        className="text-sm outline-none placeholder:text-neutral-500"
      />
      <div className="flex items-center gap-3 text-neutral-600">
        <button type="button" disabled aria-label="Attach file">
          <Plus className="size-6" />
        </button>
        <button type="button" disabled aria-label="Add emoji">
          <Smile className="size-6" />
        </button>
        <button
          type="submit"
          aria-label="Send"
          className="ml-auto hover:text-neutral-900"
        >
          <SendHorizontal className="size-6" />
        </button>
      </div>
    </form>
  );
};

export default MessageForm;
