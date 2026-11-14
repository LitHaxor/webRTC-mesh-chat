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
import type { Signaling } from "../../types/signaling.ts";
import { firestore } from "../firebase.ts";

export const createFirebaseSignaling = (): Signaling => {
  const rooms = collection(firestore, "rooms");

  return {
    watchRooms: (onChange) =>
      onSnapshot(query(rooms, where("answer", "==", null)), (snapshot) => {
        onChange(
          snapshot.docs.map((room) => ({
            id: room.id,
            name: room.data().name,
          })),
        );
      }),

    createRoom: async (name) => {
      const room = doc(rooms);
      await setDoc(room, { name });
      return { id: room.id, name };
    },

    publishOffer: async (roomId, offer, onAnswer) => {
      const room = doc(rooms, roomId);
      await setDoc(room, { offer, answer: null }, { merge: true });
      return onSnapshot(room, (snapshot) => {
        const answer = snapshot.data()?.answer;
        if (answer) {
          onAnswer(answer);
        }
      });
    },

    fetchOffer: async (roomId) => {
      const data = (await getDoc(doc(rooms, roomId))).data();
      if (!data?.offer || data.answer) {
        throw new Error("Room is not available");
      }
      return data.offer;
    },

    publishAnswer: async (roomId, answer) => {
      await updateDoc(doc(rooms, roomId), { answer });
    },
  };
};
