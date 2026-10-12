import { Router } from "express";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.patch("/me", async (req, res) => {
  try {
    const allowed = ["name", "accessMode", "avatarModel", "preferences"];
    for (const key of Object.keys(req.body || {})) {
      if (!allowed.includes(key)) delete req.body[key];
    }
    Object.assign(req.user, req.body);
    await req.user.save();
    res.json({ user: req.user.toPublic() });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    console.error("[users/patch]", err);
    res.status(500).json({ error: "Could not update profile" });
  }
});

router.get("/search", async (req, res) => {
  const q = (req.query.q || "").toString().trim();
  if (!q) return res.json({ users: [] });
  const users = await User.find({
    $or: [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }],
  })
    .limit(10)
    .select("name email accessMode");
  res.json({ users });
});

export default router;
