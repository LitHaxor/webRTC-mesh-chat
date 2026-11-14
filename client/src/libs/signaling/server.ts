import type { Room } from "../../types/room.ts";
import type { Signaling } from "../../types/signaling.ts";

type ServerMessage =
  | { type: "rooms"; rooms: Room[] }
  | { type: "roomCreated"; room: Room }
  | { type: "offer"; roomId: string; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; roomId: string; sdp: RTCSessionDescriptionInit }
  | { type: "error"; message: string };

type MessageOf<T extends ServerMessage["type"]> = Extract<
  ServerMessage,
  { type: T }
>;

export const createServerSignaling = (url: string): Signaling => {
  const socket = new WebSocket(url);
  const opened = Promise.withResolvers<void>();
  socket.addEventListener("open", () => opened.resolve(), { once: true });

  let rooms: Room[] = [];
  let handleRooms: (rooms: Room[]) => void = () => {};
  let handleAnswer: (answer: RTCSessionDescriptionInit) => void = () => {};

  socket.addEventListener("message", (event) => {
    const message: ServerMessage = JSON.parse(event.data);
    switch (message.type) {
      case "rooms":
        rooms = message.rooms;
        handleRooms(rooms);
        break;
      case "answer":
        handleAnswer(message.sdp);
        break;
      case "error":
        console.error("Signaling error:", message.message);
        break;
    }
  });

  const send = async (message: object) => {
    await opened.promise;
    socket.send(JSON.stringify(message));
  };

  const nextMessage = async () => {
    const { promise, resolve } = Promise.withResolvers<MessageEvent>();
    socket.addEventListener("message", resolve, { once: true });
    const event = await promise;
    return JSON.parse(event.data) as ServerMessage;
  };

  const waitFor = async <T extends ServerMessage["type"]>(type: T) => {
    while (true) {
      const message = await nextMessage();
      if (message.type === "error") {
        throw new Error(message.message);
      }
      if (message.type === type) {
        return message as MessageOf<T>;
      }
    }
  };

  return {
    watchRooms: (onChange) => {
      handleRooms = onChange;
      onChange(rooms);
      return () => {
        handleRooms = () => {};
      };
    },

    createRoom: async (name) => {
      const created = waitFor("roomCreated");
      await send({ type: "createRoom", name });
      return (await created).room;
    },

    publishOffer: async (roomId, offer, onAnswer) => {
      handleAnswer = onAnswer;
      await send({ type: "offer", roomId, sdp: offer });
      return () => {
        handleAnswer = () => {};
      };
    },

    fetchOffer: async (roomId) => {
      const offer = waitFor("offer");
      await send({ type: "join", roomId });
      return (await offer).sdp;
    },

    publishAnswer: async (roomId, answer) => {
      await send({ type: "answer", roomId, sdp: answer });
    },
  };
};
