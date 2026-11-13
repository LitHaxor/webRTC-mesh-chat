# Realtime Chat

Peer-to-peer chat built with React, TypeScript and WebRTC data channels.

## Getting started

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173 in two tabs or on two devices, enter a name in each, and click **Join**.

## Architecture

Peer-to-peer. Messages travel directly between browsers over a WebRTC data channel, so no server sees or stores them.

Signaling uses one Firestore document, `rooms/main`. The first person to join writes an offer, and the next person writes the answer.

## Project structure

```
client/src/
  App.tsx              state and wiring
  components/
    JoinForm.tsx       name input
    MessageList.tsx    messages
    MessageForm.tsx    message input
  chat/message.ts      Message type
  libs/
    firebase.ts        Firestore setup
    rtc.ts             peer connection, data channel, signaling
```

## Message protocol

Each message is one JSON object sent over the data channel:

```json
{ "name": "Alice", "text": "Hello" }
```
