import type { Participant } from "../utils/participants.ts";
import Avatar from "./Avatar.tsx";

type Props = {
  participants: Participant[];
};

const ParticipantList = ({ participants }: Props) => {
  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
      {participants.map((participant) => (
        <li key={participant.name} className="flex items-center gap-3">
          <Avatar name={participant.name} active={participant.active} />
          <span className={participant.active ? "" : "text-neutral-500"}>
            {participant.name}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default ParticipantList;
