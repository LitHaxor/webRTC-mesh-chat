const KEY_AGREEMENT = { name: "ECDH", namedCurve: "P-256" } as const;
const CIPHER = { name: "AES-GCM", length: 256 } as const;

export type Sealed = {
  iv: string;
  data: string;
};

const toBase64 = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)));

const fromBase64 = (text: string) =>
  Uint8Array.from(atob(text), (char) => char.charCodeAt(0));

export const createKeyPair = () =>
  crypto.subtle.generateKey(KEY_AGREEMENT, false, ["deriveKey"]);

export const exportPublicKey = (keyPair: CryptoKeyPair) =>
  crypto.subtle.exportKey("jwk", keyPair.publicKey);

export const deriveSharedKey = async (
  keyPair: CryptoKeyPair,
  peerPublicKey: JsonWebKey,
) => {
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    peerPublicKey,
    KEY_AGREEMENT,
    false,
    [],
  );
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    keyPair.privateKey,
    CIPHER,
    false,
    ["encrypt", "decrypt"],
  );
};

export const encryptText = async (
  key: CryptoKey,
  text: string,
): Promise<Sealed> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(text),
  );
  return { iv: toBase64(iv), data: toBase64(data) };
};

export const decryptText = async (key: CryptoKey, sealed: Sealed) => {
  const data = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(sealed.iv) },
    key,
    fromBase64(sealed.data),
  );
  return new TextDecoder().decode(data);
};
