import { useEffect, useRef, useState } from "react";
import type { Room } from "../types/room.ts";
import { watchRooms } from "../libs/rtc.ts";
import { corridorTour, mountCorridor } from "../anims/corridor.ts";
import Hairline from "../anims/Hairline.tsx";

type Props = {
  onJoin: (name: string, room: Room) => void;
  onCreate: (name: string, roomName: string) => void;
};

const Lobby = ({ onJoin, onCreate }: Props) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState("");
  const [roomName, setRoomName] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => watchRooms(setRooms), []);

  const hasName = name.trim() !== "";
  const hasRoomName = roomName.trim() !== "";

  const createRoom = () => {
    if (!hasRoomName) {
      return;
    }
    if (!hasName) {
      nameRef.current?.focus();
      return;
    }
    onCreate(name, roomName);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
      <label className="flex flex-col gap-1 text-sm font-semibold text-neutral-600">
        <span>Your name</span>
        <input
          ref={nameRef}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          className="rounded border border-neutral-300 px-3 py-2 text-base font-normal text-neutral-800 outline-none focus:border-blue-600"
        />
      </label>
      {!hasName && (
        <p className="-mt-2 text-sm text-neutral-500">
          Enter your name to join or create a room
        </p>
      )}

      <h2 className="-mb-3 text-sm font-semibold text-neutral-600">
        Active rooms
      </h2>
      <ul className="min-h-0 flex-1 divide-y divide-neutral-200 overflow-y-auto border-y border-neutral-200">
        {rooms.length === 0 && (
          <li className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-neutral-500">
            <Hairline mount={mountCorridor} stops={corridorTour} value={75} />
            <p className="font-semibold text-neutral-600">No active rooms</p>
            <p className="text-sm">Create one below to start chatting.</p>
          </li>
        )}
        {rooms.map((room) => (
          <li
            key={room.id}
            className="flex items-center justify-between gap-3 py-3"
          >
            <span className="truncate">{room.name}</span>
            <button
              type="button"
              disabled={!hasName}
              onClick={() => onJoin(name, room)}
              className="rounded bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-neutral-200 disabled:text-neutral-500"
            >
              Join
            </button>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          createRoom();
        }}
        className="flex flex-col gap-1"
      >
        <label
          htmlFor="room-name"
          className="text-sm font-semibold text-neutral-600"
        >
          New room
        </label>
        <div className="flex gap-2">
          <input
            id="room-name"
            value={roomName}
            onChange={(event) => setRoomName(event.target.value)}
            placeholder="New room name"
            className="min-w-0 flex-1 rounded border border-neutral-300 px-3 py-2 outline-none focus:border-blue-600"
          />
          <button
            type="submit"
            disabled={!hasRoomName}
            className="rounded bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-neutral-200 disabled:text-neutral-500"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
};

export default Lobby;
