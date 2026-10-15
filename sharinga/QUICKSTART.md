# Quickstart Guide - Sharinga

Sharinga needs **no API keys**. The sign avatar is rendered in the browser with
CSS 3D transforms and a built-in sign dictionary, so it works offline and free.

## 1. Configure the client (optional)

```env
# client/.env  (only needed when the API is not proxied)
VITE_API_URL=http://localhost:5000
```

If you skip this, the client calls the API on the same origin. In `vite dev`
you need it so requests reach the Express server on port 5000.

## 2. Start MongoDB

Make sure MongoDB is running locally (`mongod`) or use MongoDB Atlas.
Update `server/.env` if you use Atlas (see `server/.env.example`).

## 2b. Server env

```env
# server/.env
MONGODB_URI=mongodb://127.0.0.1:27017/sharinga
JWT_SECRET=any-long-random-string
CLIENT_ORIGIN=http://localhost:5173
```

## 3. Run locally

```bash
npm run dev
```

Open http://localhost:5173 in two incognito windows to test.

## 2. Test accessibility modes

- Register User 1 as "Standard", User 2 as "Deaf / hard of hearing"
- Create a room with User 1, join it from User 2
- The Deaf user sees the **3D sign avatar** in the right panel, signing each
  incoming message word-by-word, with the text underneath
- The Standard user sees normal text

## 3. Deploy to Render

See `RENDER_DEPLOY.md` — a single service is recommended (API + built frontend).

## Extending the sign dictionary

Signs live in `client/src/lib/sign3d/poses.js`. Add an entry to `SIGNS`:

```js
MYWORD: {
  repeats: 2,              // optional: play the frames twice
  frames: [
    { R: S(20, 12, 96, "flat") },   // S(forward, out, elbow, handshape)
    { R: S(30, 12, 58, "flat") },
  ],
},
```

Words that are not in the dictionary are fingerspelled automatically.
