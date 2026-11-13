import { useState } from "react";

type Props = {
  onJoin: (name: string) => void;
};

const JoinForm = ({ onJoin }: Props) => {
  const [name, setName] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim()) onJoin(name);
      }}
      className="flex flex-col gap-3 p-6"
    >
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Your name"
        className="rounded border border-neutral-300 px-3 py-2 outline-none focus:border-blue-600"
      />
      <button
        type="submit"
        className="rounded bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
      >
        Join
      </button>
    </form>
  );
};

export default JoinForm;
