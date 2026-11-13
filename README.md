# Realtime Chat

Peer-to-peer chat built with React, TypeScript and WebRTC data channels.

## Getting started

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173 in two tabs, enter a name in each, and click **Join**.

## Architecture

Peer-to-peer. Messages travel directly between browsers over a WebRTC data channel, so no server sees or stores them.

Signaling uses the browser's `BroadcastChannel`, which only reaches tabs in the same browser. Chatting across devices needs a signaling server.

## Message protocol

Each message is one JSON object sent over the data channel:

```json
{ "name": "Alice", "text": "Hello" }
```
