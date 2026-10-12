import { Router } from "express";
import crypto from "node:crypto";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function generateCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) code += alphabet[bytes[i] % alphabet.length];
  return code;
}

async function populateConversation(convo) {
  await convo.populate("participants", "name email accessMode avatarModel");
  const lastMessage = await Message.findOne({ conversation: convo._id })
    .sort({ createdAt: -1 })
    .select("text senderName createdAt");
  return { ...convo.toObject(), lastMessage };
}

router.get("/", async (req, res) => {
  const convos = await Conversation.find({
    participants: req.user._id,
    closed: false,
  }).sort({ updatedAt: -1 });

  const populated = await Promise.all(convos.map(populateConversation));
  res.json({ conversations: populated });
});

router.post("/", async (req, res) => {
  try {
    const convo = await Conversation.create({
      code: generateCode(),
      participants: [req.user._id],
      title: req.body?.title?.trim() || "New conversation",
    });
    res.status(201).json({ conversation: await populateConversation(convo) });
  } catch (err) {
    console.error("[conversations/create]", err);
    res.status(500).json({ error: "Could not create conversation" });
  }
});

router.post("/join", async (req, res) => {
  try {
    const code = (req.body?.code || "").toString().trim().toUpperCase();
    if (code.length !== 6) return res.status(400).json({ error: "Enter the 6-character room code" });

    const convo = await Conversation.findOne({ code, closed: false });
    if (!convo) return res.status(404).json({ error: "No room found with that code" });

    if (convo.isParticipant(req.user._id)) {
      return res.json({ conversation: await populateConversation(convo) });
    }
    if (convo.participants.length >= 2) {
      return res.status(409).json({ error: "That room already has two people" });
    }

    convo.participants.push(req.user._id);
    convo.updatedAt = new Date();
    await convo.save();
    res.json({ conversation: await populateConversation(convo) });
  } catch (err) {
    console.error("[conversations/join]", err);
    res.status(500).json({ error: "Could not join room" });
  }
});

router.get("/:id", async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo || !convo.isParticipant(req.user._id)) {
    return res.status(404).json({ error: "Conversation not found" });
  }
  res.json({ conversation: await populateConversation(convo) });
});

router.get("/:id/messages", async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo || !convo.isParticipant(req.user._id)) {
    return res.status(404).json({ error: "Conversation not found" });
  }
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const before = req.query.before ? new Date(req.query.before) : null;

  const filter = { conversation: convo._id };
  if (before) filter.createdAt = { $lt: before };

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("sender senderName text kind createdAt");

  res.json({ messages: messages.reverse() });
});

router.delete("/:id", async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo || !convo.isParticipant(req.user._id)) {
    return res.status(404).json({ error: "Conversation not found" });
  }
  convo.closed = true;
  await convo.save();
  res.json({ ok: true });
});

export default router;
