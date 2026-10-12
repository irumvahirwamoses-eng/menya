# How to Get a SignSpeak API Key (Step-by-Step)

## Step 1: Go to SignSpeak
1. Open [https://client.sign-speak.com/](https://client.sign-speak.com/) in your browser
2. Click **Sign Up** (or **Log In** if you already have an account)

## Step 2: Create your account
1. Enter your email address, name, and password
2. Check your email inbox for a verification email from SignSpeak
3. Click the verification link to confirm your account
4. Log in at [https://client.sign-speak.com/](https://client.sign-speak.com/)

## Step 3: Create a Developer Project
1. After logging in, go to your [Developer Dashboard](https://client.sign-speak.com/)
2. Look for **"API Keys"**, **"Projects"**, or **"Developer"** section (UI may change slightly)
3. Click **Create Project** / **New Project**
4. Give it a name (e.g., `Sharinga`)
5. Save/create the project

## Step 4: Generate your API Key
1. Inside your project, go to **API Keys** tab
2. Click **Generate API Key** / **Create Key**
3. Choose **Public** key type (recommended for browser/frontend use)
4. Copy the generated key immediately (you may not see it again after closing the dialog)

## Step 5: Add it to Sharinga

### Option A: Environment variable (recommended for production)
Add to `client/.env` (local dev):

```env
VITE_SIGNSPEAK_API_KEY=your_copied_api_key_here
```

For Render/Vercel, add `VITE_SIGNSPEAK_API_KEY` in your build environment variables.

### Option B: Settings page (local only)
In the app → Settings → ASL avatar key → paste and save (stored in browser localStorage).

## Notes
- Free tier is available for testing. Check your [dashboard](https://client.sign-speak.com/) for usage/quota.
- The key is public-key safe for frontend use with domain restrictions if enabled in your SignSpeak project settings.
- Captions always work as fallback if the avatar is unavailable.

If you see any changes to their UI, the key is always under Developer/API section of your project.
