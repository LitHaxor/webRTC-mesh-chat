import { useEffect, useState } from "react";
import { fetchPreview } from "../libs/previews.ts";
import type { LinkPreview as Preview } from "../types/preview.ts";

type Props = {
  url: string;
};

const LinkPreview = ({ url }: Props) => {
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const load = async () => {
      try {
        const data = await fetchPreview(url);
        if (isCurrent) {
          setPreview(data);
        }
      } catch (error) {
        console.warn("No preview for", url, error);
      }
    };

    void load();
    return () => {
      isCurrent = false;
    };
  }, [url]);

  if (!preview?.title) {
    return null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 block overflow-hidden rounded border border-neutral-200 hover:bg-neutral-50"
    >
      {preview.image && (
        <img
          src={preview.image}
          alt=""
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
          className="aspect-[1.91/1] w-full border-b border-neutral-200 object-cover"
        />
      )}
      <div className="p-3">
        <p className="truncate font-semibold">{preview.title}</p>
        {preview.description && (
          <p className="line-clamp-2 text-sm text-neutral-600">
            {preview.description}
          </p>
        )}
        <p className="mt-1 text-xs text-neutral-500">
          {new URL(preview.url).hostname}
        </p>
      </div>
    </a>
  );
};

export default LinkPreview;
