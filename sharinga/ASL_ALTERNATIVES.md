# Free ASL Alternatives (No SignSpeak dependency)

Since SignSpeak can be unstable, use one of these free/open approaches:

## Option 1: Static Sign Clips (Simplest, Free, Reliable)
- Create small library of common ASL word clips (MP4) in `client/public/signs/` (e.g., hello.mp4, yes.mp4)
- For incoming text, split into keywords and show matching clips in sequence
- Falls back to captions if no clip found
- Great for Rwanda common phrases

## Option 2: sign-language-translator (Self-hostable)
- Python package: [sign-language-translator](https://github.com/sign-language-translator/sign-language-translator)
- Can run FastAPI service locally/Render free tier (Python)
- Returns gloss or renders avatar
- Needs Python runtime + model files

## Option 3: Text-to-Video via HuggingFace (Free tier)
- Use public models on HuggingFace Spaces/Inferences (rate-limited)
- Return video URL and display in avatar panel
- Add key via env if needed

## Recommended now
Keep captions-first (as implemented). This is reliable, accessible, and works everywhere. Add static clips next for visual signing without external paid APIs.
