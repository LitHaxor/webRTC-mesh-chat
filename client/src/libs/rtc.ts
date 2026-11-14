import type { Room } from "../types/room.ts";
import { signaling } from "./signaling/index.ts";

const servers: RTCConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

const ICE_GATHERING_TIMEOUT_MS = 2000;

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

window.addEventListener("pagehide", () => pc.close());

const reconnect = async () => {
  stopWaitingForAnswer();
  channel.onclose = null;
  pc.close();
  ({ pc, channel } = createPeer());
  try {
    await hostRoom(roomId);
  } catch (error) {
    console.error("Error reconnecting:", error);
  }
};

const waitForIceGathering = () =>
  new Promise<void>((resolve) => {
    if (pc.iceGatheringState === "complete") {
      return resolve();
    }
    setTimeout(resolve, ICE_GATHERING_TIMEOUT_MS);
    pc.addEventListener("icegatheringstatechange", () => {
      if (pc.iceGatheringState === "complete") {
        resolve();
      }
    });
  });

const applyAnswer = async (answer: RTCSessionDescriptionInit) => {
  if (pc.signalingState !== "have-local-offer") {
    return;
  }
  try {
    await pc.setRemoteDescription(answer);
  } catch (error) {
    console.error("Error setting remote description:", error);
  }
};

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
  signaling.watchRooms(onChange);

export const createRoom = (name: string) => signaling.createRoom(name);

export const hostRoom = async (id: string) => {
  roomId = id;
  await pc.setLocalDescription();
  await waitForIceGathering();
  stopWaitingForAnswer = await signaling.publishOffer(
    id,
    pc.localDescription!.toJSON(),
    applyAnswer,
  );
};

export const joinRoom = async (id: string) => {
  roomId = id;
  const offer = await signaling.fetchOffer(id);
  await pc.setRemoteDescription(offer);
  await pc.setLocalDescription();
  await waitForIceGathering();
  await signaling.publishAnswer(id, pc.localDescription!.toJSON());
};
