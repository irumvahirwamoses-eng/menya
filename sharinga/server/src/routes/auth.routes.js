import { Router } from "express";
import User from "../models/User.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, accessMode } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: "An account with this email already exists" });

    const user = await User.create({
      name,
      email,
      password,
      accessMode: accessMode || "standard",
    });

    res.status(201).json({ token: signToken(user), user: user.toPublic() });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "Email already registered" });
    console.error("[auth/register]", err);
    res.status(500).json({ error: "Could not create account" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }
    res.json({ token: signToken(user), user: user.toPublic() });
  } catch (err) {
    console.error("[auth/login]", err);
    res.status(500).json({ error: "Could not sign in" });
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

export default router;
