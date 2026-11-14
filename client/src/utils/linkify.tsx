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
