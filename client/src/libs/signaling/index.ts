import type { Signaling } from "../../types/signaling.ts";
import { createFirebaseSignaling } from "./firebase.ts";
import { createServerSignaling } from "./server.ts";

const serverUrl =
  import.meta.env.VITE_SIGNAL_URL ?? "ws://localhost:8080/api/v1/signaling/ws";

const chooseSignaling = (): Signaling => {
  if (window.location.pathname.startsWith("/old")) {
    return createFirebaseSignaling();
  }
  return createServerSignaling(serverUrl);
};

export const signaling = chooseSignaling();
