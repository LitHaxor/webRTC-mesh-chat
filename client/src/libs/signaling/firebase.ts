import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { SignalHandler, Signaling } from "../../types/signaling.ts";
import { firestore } from "../firebase.ts";

type Signal = {
  from: string;
  to: string;
  kind: "offer" | "answer";
  sdp: RTCSessionDescriptionInit;
};

export const createFirebaseSignaling = (): Signaling => {
  const rooms = collection(firestore, "rooms");
  const myId = crypto.randomUUID();
  const handled = new Set<string>();
  let handleOffer: SignalHandler = () => {};
  let handleAnswer: SignalHandler = () => {};

  const deliver = (signal: Signal) => {
    const key = `${signal.from}:${signal.kind}`;
    if (signal.to !== myId || handled.has(key)) {
      return;
    }
    handled.add(key);
    if (signal.kind === "offer") {
      handleOffer(signal.from, signal.sdp);
      return;
    }
    handleAnswer(signal.from, signal.sdp);
  };

  const watchSignals = (roomId: string) =>
    onSnapshot(doc(rooms, roomId), (snapshot) => {
      const signals: Signal[] = snapshot.data()?.signals ?? [];
      signals.forEach(deliver);
    });

  const sendSignal = (roomId: string, signal: Omit<Signal, "from">) =>
    updateDoc(doc(rooms, roomId), {
      signals: arrayUnion({ ...signal, from: myId }),
    });

  return {
    watchRooms: (onChange) =>
      onSnapshot(rooms, (snapshot) => {
        onChange(
          snapshot.docs.map((room) => ({
            id: room.id,
            name: room.data().name,
          })),
        );
      }),

    createRoom: async (name) => {
      const room = doc(rooms);
      await setDoc(room, { name, members: [myId], signals: [] });
      watchSignals(room.id);
      return { id: room.id, name };
    },

    joinRoom: async (roomId) => {
      const room = doc(rooms, roomId);
      const members: string[] = (await getDoc(room)).data()?.members ?? [];
      await updateDoc(room, { members: arrayUnion(myId) });
      watchSignals(roomId);
      return members;
    },

    sendOffer: (roomId, peerId, offer) =>
      sendSignal(roomId, { to: peerId, kind: "offer", sdp: offer }),

    sendAnswer: (roomId, peerId, answer) =>
      sendSignal(roomId, { to: peerId, kind: "answer", sdp: answer }),

    onOffer: (handler) => {
      handleOffer = handler;
    },

    onAnswer: (handler) => {
      handleAnswer = handler;
    },
  };
};
