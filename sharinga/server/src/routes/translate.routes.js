import { Router } from "express";
const router = Router();

router.post("/", async (req, res) => {
  try {
    const text = (req.body?.text || "").trim();
    if (!text) return res.status(400).json({ error: "Text required" });
    const url = process.env.SIGN_SERVICE_URL;
    if (url && url.trim()) {
      try {
        const resp = await fetch(`${url.replace(/\/$/, "")}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (resp.ok) {
          const data = await resp.json();
          return res.json(data);
        }
      } catch {}
    }
    const words = text.split(/\s+/).filter(Boolean);
    const gloss = words.map((w) => w.replace(/[^A-Za-z0-9]/g, "").toUpperCase()).join(" ");
    return res.json({ text, gloss: gloss || text.toUpperCase(), success: true });
  } catch (e) {
    res.status(500).json({ error: "Translation failed" });
  }
});

export default router;
