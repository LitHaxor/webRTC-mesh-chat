export type KeyFrame = {
  type: "key";
  publicKey: JsonWebKey;
};

export type EncryptedFrame = {
  type: "encrypted";
  iv: string;
  data: string;
};

export type Frame = KeyFrame | EncryptedFrame;
