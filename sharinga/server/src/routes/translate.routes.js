import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/", async (req, res) => {
  try {
    const text = (req.body?.text || "").trim();
    if (!text) return res.status(400).json({ error: "Text required" });
    const url = process.env.SIGN_SERVICE_URL;
    if (!url) return res.status(500).json({ error: "SIGN_SERVICE_URL not configured" });
    const resp = await fetch(`${url.replace(/\/$/, "")}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await resp.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Translation failed" });
  }
});

export default router;
