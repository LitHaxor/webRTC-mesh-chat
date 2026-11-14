import type { secureChannel } from "../secureChannel.ts";

export type Peer = {
  pc: RTCPeerConnection;
  channel: RTCDataChannel;
  secure: ReturnType<typeof secureChannel>;
};
