# Realtime Chat

Peer-to-peer chat built with React, TypeScript and WebRTC data channels.

## Getting started

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173 in two tabs or on two devices. Enter a name, create a room in one, and join it from the other.

## Architecture

Peer-to-peer. Messages travel directly between browsers over a WebRTC data channel, so no server sees or stores them.

Signaling uses one Firestore document per room in `rooms/`. The person who creates the room writes an offer, and the person who joins writes the answer. A room is listed in the lobby while it waits for someone to join.

## Project structure

```
client/src/
  App.tsx              layout
  components/
    Lobby.tsx          name, room list, create room
    MessageList.tsx    messages and join/leave rows
    MessageForm.tsx    message input
  store/
    index.ts           store, connects rtc events to it
    roomSlice.ts       name, room, peer, join, create
    chatSlice.ts       events, send
  types/
    events.ts          ChatEvent, RoomEvent
    message.ts         Message
    room.ts            Room
  libs/
    firebase.ts        Firestore setup
    rtc.ts             peer connection, data channel, signaling
  test/                unit tests (Vitest)
client/test/           end-to-end tests (Playwright)
```

## Message protocol

Each event is one JSON object sent over the data channel.

A message:

```json
{
  "type": "sent",
  "sessionId": "<room id>",
  "payload": {
    "message": {
      "id": "…",
      "userId": "…",
      "userName": "Alice",
      "text": "Hello",
      "createdAt": 1763078400000
    },
    "metadata": {}
  }
}
```

When the connection opens, each side announces itself with `{ "type": "joined", "userName": "Alice" }`. "left" and "rejoined" are worked out locally and never sent.
