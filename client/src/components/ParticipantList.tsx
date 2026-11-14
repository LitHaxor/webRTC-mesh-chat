type Props = {
  participants: string[];
};

const ParticipantList = ({ participants }: Props) => {
  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
      {participants.map((participant) => (
        <li key={participant}>{participant}</li>
      ))}
    </ul>
  );
};

export default ParticipantList;
