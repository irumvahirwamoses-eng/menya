import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    title: { type: String, trim: true, maxlength: 80 },
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    lastMessage: {
      text: { type: String, default: "" },
      at: { type: Date },
      senderName: { type: String, default: "" },
    },
    closed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

conversationSchema.methods.isParticipant = function (userId) {
  return this.participants.some((p) => p.toString() === userId.toString());
};

export default mongoose.model("Conversation", conversationSchema);
