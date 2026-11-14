import type { Room } from "../types/room.ts";
import { secureChannel } from "./secureChannel.ts";
import { signaling } from "./signaling/index.ts";

const servers: RTCConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};

const ICE_GATHERING_TIMEOUT_MS = 2000;

type Peer = {
  pc: RTCPeerConnection;
  channel: RTCDataChannel;
  secure: ReturnType<typeof secureChannel>;
};

const peers = new Map<string, Peer>();
let roomId = "";
let handleMessage: (peerId: string, data: string) => void = () => {};
let handleOpen: (peerId: string) => void = () => {};
let handleClose: (peerId: string) => void = () => {};

const createPeer = (peerId: string) => {
  const pc = new RTCPeerConnection(servers);
  const channel = pc.createDataChannel("chat", {
    negotiated: true,
    id: 0,
  });
  const secure = secureChannel(channel, (text) => handleMessage(peerId, text));
  channel.onmessage = (event) => secure.receive(event.data);
  channel.onopen = () => {
    secure.start();
    handleOpen(peerId);
  };
  channel.onclose = () => {
    peers.delete(peerId);
    pc.close();
    handleClose(peerId);
  };
  peers.set(peerId, { pc, channel, secure });
  return pc;
};

window.addEventListener("pagehide", () => {
  for (const { pc } of peers.values()) {
    pc.close();
  }
});

const waitForIceGathering = (pc: RTCPeerConnection) =>
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

const describeLocally = async (pc: RTCPeerConnection) => {
  await pc.setLocalDescription();
  await waitForIceGathering(pc);
  return pc.localDescription!.toJSON();
};

const callPeer = async (peerId: string) => {
  const pc = createPeer(peerId);
  await signaling.sendOffer(roomId, peerId, await describeLocally(pc));
};

const answerCall = async (peerId: string, offer: RTCSessionDescriptionInit) => {
  try {
    const pc = createPeer(peerId);
    await pc.setRemoteDescription(offer);
    await signaling.sendAnswer(roomId, peerId, await describeLocally(pc));
  } catch (error) {
    console.error("Error answering a call:", error);
  }
};

const acceptAnswer = async (
  peerId: string,
  answer: RTCSessionDescriptionInit,
) => {
  try {
    await peers.get(peerId)?.pc.setRemoteDescription(answer);
  } catch (error) {
    console.error("Error setting remote description:", error);
  }
};

signaling.onOffer(answerCall);
signaling.onAnswer(acceptAnswer);

const isOpen = ({ channel }: Peer) => channel.readyState === "open";

const sendToAll = async (open: Peer[], data: string) => {
  const sent = await Promise.all(open.map(({ secure }) => secure.send(data)));
  return sent.every(Boolean);
};

export const onMessage = (handler: (peerId: string, data: string) => void) => {
  handleMessage = handler;
};

export const onOpen = (handler: (peerId: string) => void) => {
  handleOpen = handler;
};

export const onClose = (handler: (peerId: string) => void) => {
  handleClose = handler;
};

export const sendData = (data: string) => {
  const open = [...peers.values()].filter(isOpen);
  if (open.length === 0) {
    return null;
  }
  return sendToAll(open, data);
};

export const sendTo = (peerId: string, data: string) => {
  const peer = peers.get(peerId);
  if (!peer || !isOpen(peer)) {
    return null;
  }
  return peer.secure.send(data);
};

export const watchRooms = (onChange: (rooms: Room[]) => void) =>
  signaling.watchRooms(onChange);

export const createRoom = async (name: string) => {
  const room = await signaling.createRoom(name);
  roomId = room.id;
  return room;
};

export const joinRoom = async (id: string) => {
  roomId = id;
  const peerIds = await signaling.joinRoom(id);
  await Promise.all(peerIds.map(callPeer));
};
