import { beforeEach, expect, it, vi } from "vitest";
import { useChatStore } from "../chat/store.ts";
import { sendData } from "../libs/rtc.ts";

vi.mock("../libs/rtc.ts", () => ({
  connect: vi.fn(),
  onMessage: vi.fn(),
  sendData: vi.fn(),
}));

beforeEach(() => {
  useChatStore.setState({ name: "Alice", messages: [] });
});

it("adds a message once it is sent", () => {
  vi.mocked(sendData).mockReturnValue(true);

  expect(useChatStore.getState().send("hi")).toBe(true);
  expect(useChatStore.getState().messages).toEqual([
    { name: "Alice", text: "hi" },
  ]);
});

it("keeps nothing when the message could not be sent", () => {
  vi.mocked(sendData).mockReturnValue(false);

  expect(useChatStore.getState().send("hi")).toBe(false);
  expect(useChatStore.getState().messages).toEqual([]);
});
