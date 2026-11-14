import { secureChannel } from "../secureChannel.ts";
import type { Peer } from "./stream-type.ts";

export const peers = new Map<string, Peer>();
let handleMessage: (peerId: string, data: string) => void = () => {};
let handleOpen: (peerId: string) => void = () => {};
let handleClose: (peerId: string) => void = () => {};

export const openChannel = (peerId: string, pc: RTCPeerConnection) => {
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
};

window.addEventListener("pagehide", () => {
  for (const { pc } of peers.values()) {
    pc.close();
  }
});

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
