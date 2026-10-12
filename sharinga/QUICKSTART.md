# Quickstart Guide - Sharinga

## 1. Get SignSpeak API Key (Avatar)
Follow step-by-step: `SIGNSPEAK_API_KEY_GUIDE.md`

Once you have the key, create `client/.env`:

```env
VITE_SIGNSPEAK_API_KEY=your_actual_key_here
VITE_API_URL=http://localhost:5000
```

## 2. Start MongoDB
Make sure MongoDB is running locally (mongod) or use Atlas. Update `server/.env` if using Atlas.

## 3. Run Locally
```bash
cd C:\Users\Dell\OneDrive\Desktop\sharinga
npm run dev
```

Open http://localhost:5173 in two incognito windows to test.

## 4. Test Accessibility Modes
- Register User 1 as "Standard", User 2 as "Deaf/Hard of hearing"
- Create room from User 1, join from User 2
- Deaf user sees ASL avatar in right panel + captions
- Standard sees normal text

## 5. Deploy to Render
See `RENDER_DEPLOY.md` - one service recommended. Add `VITE_SIGNSPEAK_API_KEY` to Render build env.