import EmojiPicker from "emoji-picker-react";
import { Plus, SendHorizontal, Smile } from "lucide-react";
import { useState } from "react";
import { hasGiphy } from "../libs/giphy.ts";
import GifPicker from "./GifPicker.tsx";

type Picker = "emoji" | "gif" | null;

type Props = {
  onSend: (text: string) => boolean;
  onTyping: () => void;
};

const MessageForm = ({ onSend, onTyping }: Props) => {
  const [draft, setDraft] = useState("");
  const [picker, setPicker] = useState<Picker>(null);

  const toggle = (next: Picker) => setPicker(picker === next ? null : next);
  const hasDraft = draft.trim() !== "";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (hasDraft && onSend(draft)) setDraft("");
      }}
      className="relative m-3 flex flex-col gap-4 rounded border border-neutral-300 p-3 focus-within:border-blue-600"
    >
      {picker === "emoji" && (
        <div className="absolute bottom-full left-0 mb-2">
          <EmojiPicker
            width={320}
            height={380}
            onEmojiClick={({ emoji }) => {
              setDraft((draft) => draft + emoji);
              setPicker(null);
            }}
          />
        </div>
      )}
      {picker === "gif" && (
        <GifPicker
          onPick={(url) => {
            onSend(url);
            setPicker(null);
          }}
        />
      )}
      <input
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          onTyping();
        }}
        placeholder="Write to everyone"
        className="text-sm outline-none placeholder:text-neutral-500"
      />
      <div className="flex items-center gap-3 text-neutral-600">
        <button
          type="button"
          disabled
          aria-label="Attach file"
          className="disabled:opacity-40"
        >
          <Plus className="size-6" />
        </button>
        <button
          type="button"
          aria-label="Add emoji"
          aria-expanded={picker === "emoji"}
          onClick={() => toggle("emoji")}
          className="hover:text-neutral-900 active:scale-90"
        >
          <Smile className="size-6" />
        </button>
        <button
          type="button"
          aria-label="Add GIF"
          aria-expanded={picker === "gif"}
          disabled={!hasGiphy}
          title={hasGiphy ? undefined : "Set VITE_GIPHY_API_KEY to search GIFs"}
          onClick={() => toggle("gif")}
          className="rounded border-2 border-current px-1 text-xs font-bold hover:text-neutral-900 active:scale-90 disabled:opacity-40"
        >
          GIF
        </button>
        <button
          type="submit"
          aria-label="Send"
          disabled={!hasDraft}
          className="ml-auto text-blue-600 hover:text-blue-700 active:scale-90 disabled:text-neutral-400"
        >
          <SendHorizontal className="size-6" />
        </button>
      </div>
    </form>
  );
};

export default MessageForm;
