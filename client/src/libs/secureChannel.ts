import type { EncryptedFrame, Frame, KeyFrame } from "../types/frames.ts";
import {
  createKeyPair,
  decryptText,
  deriveSharedKey,
  encryptText,
  exportPublicKey,
} from "./crypto.ts";

type Task = () => Promise<void>;

const inOrder = () => {
  const tasks: Task[] = [];
  let running = false;

  const runNext = async (): Promise<void> => {
    const next = tasks.shift();
    if (!next) {
      running = false;
      return;
    }
    try {
      await next();
    } catch (error) {
      console.error("Secure channel error:", error);
    }
    return runNext();
  };

  return (task: Task) => {
    tasks.push(task);
    if (running) {
      return;
    }
    running = true;
    void runNext();
  };
};

export const secureChannel = (
  channel: { send: (data: string) => void },
  onMessage: (text: string) => void,
) => {
  const keyPair = createKeyPair();
  const sharedKey = Promise.withResolvers<CryptoKey>();
  const inbound = inOrder();
  const outbound = inOrder();

  const sendKey = async () => {
    try {
      const publicKey = await exportPublicKey(await keyPair);
      const frame: KeyFrame = { type: "key", publicKey };
      channel.send(JSON.stringify(frame));
    } catch (error) {
      console.error("Error sending the public key:", error);
    }
  };

  const acceptKey = async (frame: KeyFrame) => {
    try {
      sharedKey.resolve(await deriveSharedKey(await keyPair, frame.publicKey));
    } catch (error) {
      console.error("Error reading the other public key:", error);
    }
  };

  const open = async (frame: EncryptedFrame) => {
    onMessage(await decryptText(await sharedKey.promise, frame));
  };

  const seal = async (text: string) => {
    const sealed = await encryptText(await sharedKey.promise, text);
    const frame: EncryptedFrame = { type: "encrypted", ...sealed };
    channel.send(JSON.stringify(frame));
  };

  return {
    start: () => {
      void sendKey();
    },
    receive: (raw: string) => {
      const frame: Frame = JSON.parse(raw);
      if (frame.type === "key") {
        void acceptKey(frame);
        return;
      }
      inbound(() => open(frame));
    },
    send: (text: string) => {
      const sent = Promise.withResolvers<boolean>();
      outbound(async () => {
        try {
          await seal(text);
          sent.resolve(true);
        } catch (error) {
          console.error("Error sending an encrypted message:", error);
          sent.resolve(false);
        }
      });
      return sent.promise;
    },
  };
};
