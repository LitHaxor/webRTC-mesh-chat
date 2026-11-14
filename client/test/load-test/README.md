# Load tests and measurements

The scripts in this folder produce each number, chart, GIF and screenshot in the main README. They are Playwright scripts that drive two real Chrome windows against the real app, so they measure what a person would see.

They measure; they do not pass or fail, and CI does not run them. The reasoning is in the main README under [Load test strategy](../../../README.md#load-test-strategy).

## Run them

```bash
make load-test        # from the repository root: runs every script below
make plots            # redraws the charts from the new numbers
```

Or one at a time, from `client/`:

```bash
npx playwright test -c playwright.load-test.config.ts large-volume
```

Playwright starts both servers. Results go to `docs/data/` as JSON, and images to `docs/images/`.

## What each script does

| Script                 | What it measures                                                                                                                                     | Writes                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `large-volume.spec.ts` | A room with 100 to 20,000 saved messages: time to open, frames per second while idle, time for a new message to appear, memory, elements on the page | `docs/data/large-volume.json`             |
| `recording.spec.ts`    | Records a room with 10,000 messages while someone receives, types and scrolls, with a live frame counter                                             | `docs/data/videos/large-room-<name>.webm` |
| `realtime.spec.ts`     | Message latency over 200 messages, and how long connecting, leaving and rejoining take over 15 runs                                                  | `docs/data/realtime.json`                 |
| `encryption.spec.ts`   | Encrypted frame size and time for growing messages, and the largest message that can be sent                                                         | `docs/data/encryption.json`               |
| `screenshots.spec.ts`  | The screenshots in the main README                                                                                                                   | `docs/images/*.png`                       |

`docs/data/large-volume-before.json` and `docs/data/realtime-before.json` hold the same measurements taken on the first message list, before it was virtualized.

## The test conversation

A generated history fills the large rooms:

- six people: you, and five others with random names
- random messages made with [faker](https://fakerjs.dev): mostly one-line sentences, some quick replies ("Agreed.", "On it."), some long ones, some single emoji
- random gaps of 2 to 58 seconds between messages
- a fixed seed, so each run, and both the "before" and "after" recordings, use the same conversation

The script writes the history straight into the browser's IndexedDB, where the app keeps it, and then opens the room the normal way. Two browsers are connected; the other four names exist in the history and nowhere else.

## Turning a recording into a GIF

```bash
# from client/
RECORD_AS=after npx playwright test -c playwright.load-test.config.ts recording
uv run --with imageio-ffmpeg python test/load-test/to_gif.py \
  ../docs/data/videos/large-room-after.webm ../docs/images/large-room-after.gif
```

The first time, Playwright needs its recorder: `npx playwright install ffmpeg`. The `.webm` recordings stay out of git; the GIFs are committed.
