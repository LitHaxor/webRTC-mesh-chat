const signaling = new BroadcastChannel("signaling");
const pc = new RTCPeerConnection();

export const channel = pc.createDataChannel("chat", { negotiated: true, id: 0 });

pc.onicecandidate = ({ candidate }) => {
  if (candidate) signaling.postMessage({ candidate: candidate.toJSON() });
};

signaling.onmessage = async ({ data }) => {
  if (data.candidate) return pc.addIceCandidate(data.candidate);
  await pc.setRemoteDescription(data);
  if (data.type === "offer") {
    await pc.setLocalDescription();
    signaling.postMessage(pc.localDescription!.toJSON());
  }
};

export const connect = async () => {
  await pc.setLocalDescription();
  signaling.postMessage(pc.localDescription!.toJSON());
};
