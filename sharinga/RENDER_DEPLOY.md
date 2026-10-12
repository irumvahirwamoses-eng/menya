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
   | `VITE_SIGNSPEAK_API_KEY` | your Sign-Speak API key (put in Render "Build" env for Vite) |

Note: For Vite, env vars must be available at build time as VITE_*. Put `VITE_SIGNSPEAK_API_KEY` in Render's environment (build-time) or in client/.env.production before pushing.

## Alternative: separate Vercel (frontend) + Render (backend)

Frontend (Vercel): set `VITE_API_URL` and `VITE_SIGNSPEAK_API_KEY`. Update api/socket to use VITE_API_URL. Backend (Render): set `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_ORIGIN=https://your-app.vercel.app`.