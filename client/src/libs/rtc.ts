import { doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { firestore } from "./firebase.ts";

const servers: RTCConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

const pc = new RTCPeerConnection(servers);
const room = doc(firestore, "rooms", "main");

export const channel = pc.createDataChannel("chat", {
  negotiated: true,
  id: 0,
});

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

export const connect = async () => {
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
  await setDoc(room, { offer: pc.localDescription!.toJSON(), answer: null });

  onSnapshot(room, async (snapshot) => {
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
