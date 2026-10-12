import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const ACCESS_MODES = ["standard", "deaf", "speech", "blind", "cognitive"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    accessMode: { type: String, enum: ACCESS_MODES, default: "standard" },
    preferences: {
      theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
      textSize: { type: String, enum: ["md", "lg", "xl"], default: "md" },
      highContrast: { type: Boolean, default: false },
      autoSpeak: { type: Boolean, default: true },
      reduceMotion: { type: Boolean, default: false },
    },
    avatarModel: { type: String, enum: ["MALE", "FEMALE"], default: "MALE" },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    accessMode: this.accessMode,
    preferences: this.preferences,
    avatarModel: this.avatarModel,
  };
};

export const ACCESS_MODE_LIST = ACCESS_MODES;
export default mongoose.model("User", userSchema);
