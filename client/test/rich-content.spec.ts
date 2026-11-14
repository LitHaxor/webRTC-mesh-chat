import type { Page } from "@playwright/test";
import { chatOf, expect, sendMessage, startChat, test } from "./helpers.ts";

const gifUrl = "https://media.giphy.com/media/e2e/200.gif";

const pixel = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

const fakeGiphy = async (page: Page) => {
  await page.route("https://api.giphy.com/v1/gifs/search*", (route) =>
    route.fulfill({
      json: {
        data: [
          {
            id: "e2e",
            title: "party parrot",
            images: { fixed_height: { url: gifUrl } },
          },
        ],
      },
    }),
  );
  await page.route("https://media.giphy.com/**", (route) =>
    route.fulfill({ contentType: "image/gif", body: pixel }),
  );
};

test("you can pick an emoji and send it", async ({ newPerson }) => {
  const { alice, bob } = await startChat(newPerson);

  await alice.getByRole("button", { name: "Add emoji" }).click();
  await alice.getByLabel("Type to search for an emoji").fill("rocket");
  await alice.getByLabel("rocket", { exact: true }).click();

  await expect(alice.getByPlaceholder("Write to everyone")).toHaveValue("🚀");
  await alice.getByRole("button", { name: "Send" }).click();
  await expect(chatOf(bob)).toContainText("🚀");
});

test("a link shows a preview of the page", async ({ newPerson }) => {
  const { alice, bob } = await startChat(newPerson);

  await sendMessage(alice, "docs: http://localhost:8080/docs");

  const preview = bob.getByRole("link", { name: /Swagger UI/ });
  await expect(preview).toBeVisible();
  await expect(preview).toContainText("localhost");
});

test("you can search Giphy and send a GIF", async ({ newPerson }) => {
  const { alice, bob } = await startChat(newPerson);
  await fakeGiphy(alice);
  await fakeGiphy(bob);

  await alice.getByRole("button", { name: "Add GIF" }).click();
  await alice.getByPlaceholder("Search GIFs").fill("party");
  await alice.keyboard.press("Enter");
  await alice.getByRole("img", { name: "party parrot" }).click();

  await expect(bob.getByRole("img", { name: "GIF" })).toHaveAttribute(
    "src",
    gifUrl,
  );
});
