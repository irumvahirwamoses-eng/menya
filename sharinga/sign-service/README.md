# Sign Service (sign-language-translator)

Self-hostable FastAPI service to translate English text to ASL gloss.

## Run locally
```bash
cd sign-service
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Health: http://localhost:8000/health
Translate: POST http://localhost:8000/translate with {"text":"Hello"}

## Deploy to Render (free)
- New Web Service → connect repo, root directory: `sign-service`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- Free tier works for testing.

## Use from Node/Frontend
Set `SIGN_SERVICE_URL` in server `.env`. Node backend can proxy translate requests; frontend can call directly if CORS configured.
