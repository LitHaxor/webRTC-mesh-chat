import {
  chatOf,
  createRoom,
  expect,
  joinRoom,
  messageRow,
  sendMessage,
  test,
  uniqueRoomName,
  type Page,
} from "./helpers.ts";

type NewPerson = () => Promise<Page>;

const startGroupChat = async (newPerson: NewPerson, names: string[]) => {
  const roomName = uniqueRoomName();
  const [creator, ...joiners] = names;
  const first = await newPerson();
  await createRoom(first, creator, roomName);
  const pages = [first];

  for (const name of joiners) {
    const page = await newPerson();
    await joinRoom(page, name, roomName);
    for (const earlier of pages) {
      await expect(chatOf(earlier)).toContainText(`${name} joined`);
    }
    pages.push(page);
  }

  return pages;
};

const TRIO = ["Alice", "Bob", "Carol"];
const SEVEN = ["Alice", "Bob", "Carol", "Dave", "Erin", "Frank", "Grace"];

test("three people in one room all see each other's messages", async ({
  newPerson,
}) => {
  const [alice, bob, carol] = await startGroupChat(newPerson, TRIO);

  await sendMessage(alice, "from alice");
  await sendMessage(bob, "from bob");
  await sendMessage(carol, "from carol");

  for (const page of [alice, bob, carol]) {
    await expect(messageRow(page, "from alice")).toBeVisible();
    await expect(messageRow(page, "from bob")).toBeVisible();
    await expect(messageRow(page, "from carol")).toBeVisible();
  }
});

test("a newcomer sees everyone who was already in the room", async ({
  newPerson,
}) => {
  const pages = await startGroupChat(newPerson, TRIO);
  const carol = pages[2];

  await expect(chatOf(carol)).toContainText("Alice joined");
  await expect(chatOf(carol)).toContainText("Bob joined");

  await carol.getByRole("tab", { name: "Participants (3)" }).click();
  await expect(carol.getByTitle("Active")).toHaveCount(3);
});

test("an edit and a delete reach everyone in the room", async ({
  newPerson,
}) => {
  const [alice, bob, carol] = await startGroupChat(newPerson, TRIO);
  await sendMessage(alice, "first draft");
  await sendMessage(alice, "to be removed");
  await expect(messageRow(carol, "to be removed")).toBeVisible();

  const draft = messageRow(alice, "first draft");
  await draft.hover();
  await draft.getByRole("button", { name: "Edit message" }).click();
  await alice.getByRole("textbox", { name: "Edit message" }).fill("final");
  await alice.keyboard.press("Enter");

  const removed = messageRow(alice, "to be removed");
  await removed.hover();
  await removed.getByRole("button", { name: "Delete message" }).click();

  for (const page of [bob, carol]) {
    await expect(messageRow(page, "final")).toContainText("(edited)");
    await expect(chatOf(page)).toContainText("Message deleted");
    await expect(messageRow(page, "to be removed")).toHaveCount(0);
  }
});

test("when one of three leaves, the other two keep chatting", async ({
  newPerson,
}) => {
  const [alice, bob, carol] = await startGroupChat(newPerson, TRIO);

  await bob.close();
  await expect(chatOf(alice)).toContainText("Bob left");
  await expect(chatOf(carol)).toContainText("Bob left");

  await sendMessage(alice, "still here");
  await expect(messageRow(carol, "still here")).toBeVisible();

  await carol.getByRole("tab", { name: "Participants (3)" }).click();
  await expect(carol.getByTitle("Active")).toHaveCount(2);
});

test("seven people in one room all receive the same message", async ({
  newPerson,
}) => {
  const pages = await startGroupChat(newPerson, SEVEN);
  const grace = pages[6];

  await sendMessage(grace, "hello everyone");

  for (const page of pages) {
    await expect(messageRow(page, "hello everyone")).toBeVisible();
  }
  await grace.getByRole("tab", { name: "Participants (7)" }).click();
  await expect(grace.getByTitle("Active")).toHaveCount(7);
});
