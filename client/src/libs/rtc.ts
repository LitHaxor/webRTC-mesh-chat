import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Room } from "../types/room.ts";
import { firestore } from "./firebase.ts";

const servers: RTCConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

const rooms = collection(firestore, "rooms");

let roomId = "";
let handleMessage: (data: string) => void = () => {};
let handleOpen = () => {};
let handleClose = () => {};
let stopWaitingForAnswer = () => {};

const createPeer = () => {
  const pc = new RTCPeerConnection(servers);
  const channel = pc.createDataChannel("chat", {
    negotiated: true,
    id: 0,
  });
  channel.onmessage = (event) => handleMessage(event.data);
  channel.onopen = () => handleOpen();
  channel.onclose = async () => {
    handleClose();
    await reconnect();
  };
  return { pc, channel };
};

let { pc, channel } = createPeer();

const reconnect = async () => {
  stopWaitingForAnswer();
  channel.onclose = null;
  pc.close();
  ({ pc, channel } = createPeer());
  try {
    await connect(roomId);
  } catch (error) {
    console.error("Error reconnecting:", error);
  }
};

const waitForIceGathering = () =>
  new Promise<void>((resolve) => {
    if (pc.iceGatheringState === "complete") {
      return resolve();
    }
    pc.addEventListener("icegatheringstatechange", () => {
      if (pc.iceGatheringState === "complete") {
        resolve();
      }
    });
  });

export const onMessage = (handler: (data: string) => void) => {
  handleMessage = handler;
};

export const onOpen = (handler: () => void) => {
  handleOpen = handler;
};

export const onClose = (handler: () => void) => {
  handleClose = handler;
};

export const sendData = (data: string) => {
  if (channel.readyState !== "open") return false;
  channel.send(data);
  return true;
};

export const watchRooms = (onChange: (rooms: Room[]) => void) =>
  onSnapshot(query(rooms, where("answer", "==", null)), (snapshot) =>
    onChange(
      snapshot.docs.map((room) => ({ id: room.id, name: room.data().name })),
    ),
  );

export const createRoom = async (name: string): Promise<Room> => {
  const room = doc(rooms);
  await setDoc(room, { name });
  return { id: room.id, name };
};

export const connect = async (id: string) => {
  roomId = id;
  const room = doc(rooms, id);
  const data = (await getDoc(room)).data();

  // No offer or no answer, create an offer and wait for an answer.
  if (data?.offer && !data.answer) {
    await pc.setRemoteDescription(data.offer);
    await pc.setLocalDescription();
    await waitForIceGathering();
    await updateDoc(room, { answer: pc.localDescription!.toJSON() });
    return;
  }

  await pc.setLocalDescription();
  await waitForIceGathering();
  await setDoc(
    room,
    { offer: pc.localDescription!.toJSON(), answer: null },
    { merge: true },
  );

  stopWaitingForAnswer = onSnapshot(room, async (snapshot) => {
    const answer = snapshot.data()?.answer;
    if (answer && pc.signalingState === "have-local-offer") {
      try {
        await pc.setRemoteDescription(answer);
      } catch (error) {
        console.error("Error setting remote description:", error);
      }
    }
  });
};
