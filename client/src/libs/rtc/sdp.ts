import type { Room } from "../../types/room.ts";
import { signaling } from "../signaling/index.ts";
import { openChannel, peers } from "./rtc-data.ts";

const servers: RTCConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};

const ICE_GATHERING_TIMEOUT_MS = 2000;

let roomId = "";

const createPeer = (peerId: string) => {
  const pc = new RTCPeerConnection(servers);
  openChannel(peerId, pc);
  return pc;
};

const waitForIceGathering = (pc: RTCPeerConnection) => {
  return new Promise<void>((resolve) => {
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
};

const describeLocally = async (pc: RTCPeerConnection) => {
  await pc.setLocalDescription();
  await waitForIceGathering(pc);
  return pc.localDescription!.toJSON();
};

const callPeer = async (peerId: string) => {
  const pc = createPeer(peerId);
  const description = await describeLocally(pc);
  await signaling.sendOffer(roomId, peerId, description);
};

const answerCall = async (peerId: string, offer: RTCSessionDescriptionInit) => {
  try {
    const pc = createPeer(peerId);
    await pc.setRemoteDescription(offer);
    const description = await describeLocally(pc);
    await signaling.sendAnswer(roomId, peerId, description);
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
