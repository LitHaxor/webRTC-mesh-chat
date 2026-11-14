import {
  chatOf,
  createRoom,
  enterLobby,
  expect,
  joinRoom,
  lobbyListing,
  messageRow,
  sendMessage,
  test,
  type Browser,
  type Page,
} from "../helpers.ts";

const IMAGES = new URL("../../../docs/images/", import.meta.url).pathname;
const ROOM = "Status meeting standup";

const openPage = async (browser: Browser, width = 720, height = 700) => {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
  });
  return context.newPage();
};

const shoot = async (page: Page, name: string) => {
  const card = await page.locator("main > div").boundingBox();
  if (!card) return;
  const margin = card.x > 0 ? 20 : 0;
  await page.screenshot({
    path: `${IMAGES}${name}.png`,
    clip: {
      x: card.x - margin,
      y: card.y - margin,
      width: card.width + margin * 2,
      height: card.height + margin * 2,
    },
  });
};

const editMessage = async (page: Page, from: string, to: string) => {
  const row = messageRow(page, from);
  await row.hover();
  await row.getByRole("button", { name: "Edit message" }).click();
  await page.getByRole("textbox", { name: "Edit message" }).fill(to);
  await page.keyboard.press("Enter");
};

const joinAs = async (browser: Browser, name: string) => {
  const page = await openPage(browser);
  await joinRoom(page, name, ROOM);
  return page;
};

test("screenshots for the README", async ({ browser }) => {
  const alfonso = await openPage(browser);
  const kiana = await openPage(browser);

  await enterLobby(alfonso, "Alfonso Press");
  await expect(alfonso.getByText("No active rooms")).toBeVisible();
  await alfonso.waitForTimeout(600);
  await shoot(alfonso, "lobby-empty");

  await createRoom(alfonso, "Alfonso Press", ROOM);

  await enterLobby(kiana, "Kiana Bator");
  await expect(lobbyListing(kiana, ROOM)).toBeVisible();

  await joinRoom(kiana, "Kiana Bator", ROOM);
  const ann = await joinAs(browser, "Ann Lipshutz");
  const chance = await joinAs(browser, "Chance Carder");
  const nolan = await joinAs(browser, "Nolan Passaquindici Arcand");
  const phillip = await joinAs(browser, "Phillip Philips");
  await expect(chatOf(alfonso)).toContainText("Phillip Philips joined");

  await sendMessage(
    alfonso,
    "Waiting for a few more before we begin, I'm keeping my microphone muted for now 😉",
  );
  await sendMessage(kiana, "Very nice presentation :)");
  await expect(messageRow(alfonso, "Very nice")).toBeVisible();
  await joinAs(browser, "Phillip Rosser");
  await expect(chatOf(alfonso)).toContainText("Phillip Rosser joined");
  await sendMessage(chance, "🤩");
  await expect(messageRow(alfonso, "🤩")).toBeVisible();
  await sendMessage(nolan, "Can you share the file with us?");
  await expect(messageRow(alfonso, "Can you share")).toBeVisible();
  await ann.context().close();
  await expect(chatOf(alfonso)).toContainText("Ann Lipshutz left");
  await shoot(alfonso, "chat");

  await phillip.waitForTimeout(2200);
  await phillip.getByPlaceholder("Write to everyone").fill("Yes, here's a li");
  await expect(alfonso.getByText("Phillip Philips is typing…")).toBeVisible();
  await shoot(alfonso, "typing");

  await sendMessage(
    phillip,
    "Yes, here's a link to the file: http://localhost:8080/docs",
  );
  await expect(alfonso.getByRole("link", { name: /Swagger UI/ })).toBeVisible();

  await sendMessage(alfonso, "Thnks!");
  await editMessage(alfonso, "Thnks!", "Thanks!");
  await sendMessage(kiana, "wrong chat, sorry");
  await expect(messageRow(alfonso, "wrong chat")).toBeVisible();
  const mistake = messageRow(kiana, "wrong chat");
  await mistake.hover();
  await mistake.getByRole("button", { name: "Delete message" }).click();
  await expect(chatOf(alfonso)).toContainText("Message deleted");
  await messageRow(alfonso, "Thanks!").hover();
  await shoot(alfonso, "edit-delete");

  await alfonso.getByRole("button", { name: "Add emoji" }).click();
  await expect(alfonso.getByLabel("Type to search for an emoji")).toBeVisible();
  await alfonso.waitForTimeout(400);
  await shoot(alfonso, "emoji-picker");
  await alfonso.getByRole("button", { name: "Add emoji" }).click();

  await kiana.context().close();
  await expect(chatOf(alfonso)).toContainText("Kiana Bator left");
  const phone = await openPage(browser, 390, 844);
  await joinRoom(phone, "Kiana Bator", ROOM);
  await expect(chatOf(alfonso)).toContainText("Kiana Bator rejoined");
  await sendMessage(phone, "Back, on my phone now");
  await expect(messageRow(alfonso, "Back, on my phone")).toBeVisible();
  await sendMessage(alfonso, "Welcome back!");
  await expect(messageRow(phone, "Welcome back!")).toBeVisible();
  await shoot(alfonso, "rejoined");
  await shoot(phone, "phone");

  await alfonso.getByRole("tab", { name: /Participants/ }).click();
  await shoot(alfonso, "participants");
});
