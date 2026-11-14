import type { ChatEvent, RoomEvent } from "../types/events.ts";

export type Participant = {
  name: string;
  active: boolean;
};

export const getParticipants = (
  self: string,
  connected: string[],
  events: (ChatEvent | RoomEvent)[],
): Participant[] => {
  const names = new Set([self]);
  for (const event of events) {
    if ("userName" in event) {
      names.add(event.userName);
    }
  }

  return [...names].map((name) => ({
    name,
    active: name === self || connected.includes(name),
  }));
};
