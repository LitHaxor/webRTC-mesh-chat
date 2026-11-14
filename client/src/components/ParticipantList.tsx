import type { Participant } from "../utils/participants.ts";
import Avatar from "./Avatar.tsx";

type Props = {
  participants: Participant[];
  you: string | null;
};

const ParticipantList = ({ participants, you }: Props) => {
  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
      {participants.map((participant) => (
        <li key={participant.name} className="flex items-center gap-3">
          <Avatar name={participant.name} active={participant.active} />
          <span
            className={`min-w-0 truncate ${participant.active ? "" : "text-neutral-500"}`}
          >
            {participant.name}
            {participant.name === you && (
              <span className="text-neutral-500"> (you)</span>
            )}
          </span>
          {!participant.active && (
            <span className="ml-auto shrink-0 text-sm text-neutral-500">
              Left
            </span>
          )}
        </li>
      ))}
    </ul>
  );
};

export default ParticipantList;
