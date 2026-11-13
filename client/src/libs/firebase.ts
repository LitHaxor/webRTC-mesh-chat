import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBgZkIdRdLY_rOFuOi0Ie7L1lcRaDOGwho",
  authDomain: "discord-lite-491de.firebaseapp.com",
  projectId: "discord-lite-491de",
  storageBucket: "discord-lite-491de.firebasestorage.app",
  messagingSenderId: "455283657940",
  appId: "1:455283657940:web:902a2f0f7606fe3e80bf41",
  measurementId: "G-QFY4XS1Z6X",
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const app = getApp();

export const firestore = getFirestore(app);
