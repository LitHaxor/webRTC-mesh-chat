import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Message } from "../types/message.ts";

type StoredMessage = {
  roomId: string;
  message: Message;
};

interface ChatDB extends DBSchema {
  messages: {
    key: string;
    value: StoredMessage;
    indexes: { byRoom: string };
  };
}

const DB_NAME = "chat";
const DB_VERSION = 1;

const createStores = (database: IDBPDatabase<ChatDB>) => {
  const messages = database.createObjectStore("messages", {
    keyPath: "message.id",
  });
  messages.createIndex("byRoom", "roomId");
};

class ChatDatabase {
  private readonly db = openDB<ChatDB>(DB_NAME, DB_VERSION, {
    upgrade: createStores,
  });

  async save(roomId: string, message: Message) {
    const db = await this.db;
    await db.put("messages", { roomId, message });
  }

  async load(roomId: string) {
    const db = await this.db;
    const stored = await db.getAllFromIndex("messages", "byRoom", roomId);
    return stored
      .map(({ message }) => message)
      .sort((a, b) => a.createdAt - b.createdAt);
  }
}

export const chatDatabase = new ChatDatabase();
