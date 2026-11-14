export const linkify = (text: string) =>
  text.split(/(https?:\/\/\S+)/g).map((part, index) =>
    index % 2 ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noreferrer"
        className="text-blue-600 underline"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );

export const findUrl = (text: string) => text.match(/https?:\/\/\S+/)?.[0];

export const isImageUrl = (text: string) =>
  /^https?:\/\/\S+\.(gif|jpe?g|png|webp)(\?\S*)?$/i.test(text);
