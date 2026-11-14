import { useState } from "react";
import { searchGifs } from "../libs/giphy.ts";
import type { Gif } from "../types/gif.ts";

type Props = {
  onPick: (url: string) => void;
};

const GifPicker = ({ onPick }: Props) => {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<Gif[]>([]);

  const search = async () => {
    try {
      setGifs(await searchGifs(query));
    } catch (error) {
      console.error("Error searching GIFs:", error);
    }
  };

  return (
    <div className="absolute bottom-full left-0 mb-2 w-80 rounded border border-neutral-300 bg-white p-2 shadow">
      <input
        autoFocus
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          search();
        }}
        placeholder="Search GIFs"
        className="w-full rounded border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-blue-600"
      />
      <div className="mt-2 grid max-h-64 grid-cols-3 gap-1 overflow-y-auto">
        {gifs.map((gif) => (
          <button key={gif.id} type="button" onClick={() => onPick(gif.url)}>
            <img
              src={gif.url}
              alt={gif.title}
              className="h-20 w-full rounded object-cover"
            />
          </button>
        ))}
      </div>
      <p className="mt-1 text-right text-xs text-neutral-500">
        Powered by GIPHY
      </p>
    </div>
  );
};

export default GifPicker;
