import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

export function registerSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("unauthorized"));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id);
      if (!user) return next(new Error("unauthorized"));
      socket.user = user;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    socket.join(`user:${user._id}`);
    console.log(`[socket] connected: ${user.name}`);

    socket.on("room:join", async ({ conversationId }) => {
      try {
        const convo = await Conversation.findById(conversationId);
        if (!convo || !convo.isParticipant(user._id)) return;
        socket.join(`conv:${convo._id}`);

        const others = await Conversation.findById(convo._id).populate(
          "participants",
          "name accessMode"
        );
        const partner = others.participants.find(
          (p) => p._id.toString() !== user._id.toString()
        );
        socket.to(`conv:${convo._id}`).emit("presence:update", {
          conversationId: convo._id,
          online: true,
          userId: user._id,
        });
        socket.emit("presence:state", {
          conversationId: convo._id,
          partner: partner || null,
        });
      } catch (err) {
        console.error("[socket/room:join]", err);
      }
    });

    socket.on("room:leave", ({ conversationId }) => {
      socket.leave(`conv:${conversationId}`);
      socket.to(`conv:${conversationId}`).emit("presence:update", {
        conversationId,
        online: false,
        userId: user._id,
      });
    });

    socket.on("message:send", async ({ conversationId, text, kind }, ack) => {
      try {
        const clean = (text || "").toString().trim().slice(0, 4000);
        if (!clean) return ack?.({ error: "Message cannot be empty" });

        const convo = await Conversation.findById(conversationId);
        if (!convo || !convo.isParticipant(user._id)) {
          return ack?.({ error: "Not allowed in this room" });
        }

        const message = await Message.create({
          conversation: convo._id,
          sender: user._id,
          senderName: user.name,
          text: clean,
          kind: kind || "text",
        });

        convo.lastMessage = {
          text: clean,
          at: message.createdAt,
          senderName: user.name,
        };
        convo.updatedAt = message.createdAt;
        await convo.save();

        const payload = {
          _id: message._id,
          conversation: convo._id,
          sender: user._id,
          senderName: user.name,
          text: clean,
          kind: message.kind,
          createdAt: message.createdAt,
        };

        io.to(`conv:${convo._id}`).emit("message:new", payload);
        ack?.({ ok: true, message: payload });
      } catch (err) {
        console.error("[socket/message:send]", err);
        ack?.({ error: "Could not send message" });
      }
    });

    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(`conv:${conversationId}`).emit("typing", {
        conversationId,
        userId: user._id,
        name: user.name,
        isTyping: Boolean(isTyping),
      });
    });

    socket.on("disconnect", () => {
      console.log(`[socket] disconnected: ${user.name}`);
    });
  });
}
