# Deploying Sharinga to Render (single service)

## Setup

1. Push repo to GitHub
2. Render → New → Web Service → connect repo
3. Build Command: `npm run render-build`
4. Start Command: `npm start -w server`
5. Environment Variables:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | MongoDB Atlas connection string |
   | `JWT_SECRET` | long random string |
   | `CLIENT_ORIGIN` | `https://your-app.onrender.com` (or `*` to allow all) |

No sign-language API key is required — the 3D avatar is rendered in the browser.

## Alternative: separate Vercel (frontend) + Render (backend)

Frontend (Vercel): set `VITE_API_URL` to the backend URL. Backend (Render): set `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_ORIGIN=https://your-app.vercel.app`.