import { useEffect, useState } from "react";
import type { Room } from "../chat/room.ts";
import { watchRooms } from "../libs/rtc.ts";

type Props = {
  onJoin: (name: string, room: Room) => void;
  onCreate: (name: string, roomName: string) => void;
};

const inputClass =
  "min-w-0 rounded border border-neutral-300 px-3 py-2 outline-none focus:border-blue-600";

const buttonClass =
  "rounded bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-neutral-300";

const Lobby = ({ onJoin, onCreate }: Props) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState("");
  const [roomName, setRoomName] = useState("");

  useEffect(() => watchRooms(setRooms), []);

  const hasName = name.trim() !== "";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Your name"
        className={inputClass}
      />
      {!hasName && (
        <p className="-mt-2 text-sm text-neutral-500">
          Enter your name to join or create a room
        </p>
      )}

      <ul className="min-h-0 flex-1 divide-y divide-neutral-200 overflow-y-auto rounded border border-neutral-300">
        {rooms.length === 0 && (
          <li className="p-3 text-neutral-500">No active rooms</li>
        )}
        {rooms.map((room) => (
          <li key={room.id} className="flex items-center justify-between gap-3 p-3">
            <span className="truncate">{room.name}</span>
            <button
              type="button"
              disabled={!hasName}
              onClick={() => onJoin(name, room)}
              className={buttonClass}
            >
              Join
            </button>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (hasName && roomName.trim()) onCreate(name, roomName);
        }}
        className="flex gap-2"
      >
        <input
          value={roomName}
          onChange={(event) => setRoomName(event.target.value)}
          placeholder="New room name"
          className={`${inputClass} flex-1`}
        />
        <button
          type="submit"
          disabled={!hasName || !roomName.trim()}
          className={buttonClass}
        >
          Create
        </button>
      </form>
    </div>
  );
};

export default Lobby;
