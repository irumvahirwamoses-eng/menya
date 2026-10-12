# Sharinga

**An inclusive 1-on-1 conversation app** that bridges a person with a disability and a person without one — using an ASL avatar, live captions, voice, picture symbols and accessible design.

## What it does

Two people join a private room with a 6-character code. Each person picks a **communication mode**, and every message is automatically rendered in the format they need:

| Mode | Receives | Sends |
|---|---|---|
| **Standard** | text | text, or voice |
| **Deaf / Hard of hearing** | ASL avatar video + large captions | text |
| **Speech impairment** | text | type → app **speaks it aloud** |
| **Blind / Low vision** | messages **read aloud** automatically | voice input |
| **Cognitive / Learning** | simplified wording + **picture symbols** | text, voice, quick phrases |

## Stack

- **Frontend:** React 18, Vite, Tailwind CSS v4, lucide-react icons, React Router, Socket.IO client
- **Backend:** Node.js, Express, Socket.IO, MongoDB (Mongoose), JWT auth, bcrypt
- **Free services:**
  - [Sign-Speak](https://client.sign-speak.com) — ASL avatar (free API key)
  - Web Speech API — text-to-speech + speech-to-text (browser built-in)
  - [ARASAAC](https://arasaac.org) — picture symbols (CC BY-NC-SA)

## Getting started

```bash
# 1. install dependencies (root installs both workspaces)
npm install

# 2. configure the server
cd server
cp .env.example .env        # then edit JWT_SECRET etc.
cd ..

# 3. make sure MongoDB is running locally, then:
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:5000

Register two accounts (use different browsers/incognito to test a pair), create a room in one, join with the code in the other, and chat.

## Accessibility built in

- **Skip-to-content** link, semantic landmarks, ARIA labels everywhere
- **44px minimum** touch targets, visible focus outlines
- Light / dark / system theme, **high contrast** mode, 3 text sizes
- **Reduce motion** preference respected (plus OS-level `prefers-reduced-motion`)
- Live regions for typing indicators, captions and status messages
- Every message has a manual **Read aloud** button

## Project structure

```
sharinga/
├── client/                  # React app
│   └── src/
│       ├── pages/           # Login, Register, Lobby, Settings
│       ├── components/
│       │   ├── chat/        # Chat, MessageBubble, Composer, AslAvatar, PictogramView
│       │   ├── layout/      # AppShell (nav + menu)
│       │   └── ui/          # Button, Field, badges, avatar, logo
│       ├── context/         # AuthContext, DisplayContext (theme/contrast/text size)
│       ├── hooks/           # useTTS, useSTT, useSocket
│       └── lib/             # api client, socket, constants
├── server/
│   └── src/
│       ├── models/          # User, Conversation, Message
│       ├── routes/          # auth, users, conversations
│       ├── socket/          # realtime relay (rooms, typing, presence)
│       └── middleware/      # JWT auth
└── package.json             # workspaces + dev scripts
```

## Notes

- The Sign-Speak API key is stored **only in your browser** (Settings → ASL avatar key). Without it, Deaf mode still works via large captions.
- Voice features require Chrome/Edge and HTTPS in production (browser security rules).
