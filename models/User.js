import mongoose from "mongoose";
import { VALID_ROLES, AVAILABILITY_OPTIONS } from "../utils/constants.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: VALID_ROLES,
      required: true,
    },

    // ── Seeker fields ────────────────────────────────────────
    skills: {
      type: [String],
      default: [],
    },
    availability: {
      type: String,
      enum: AVAILABILITY_OPTIONS,
      default: "",
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    resumeUrl: {
      type: String,
      default: "",
    },

    // ── Employer fields ──────────────────────────────────────
    companyName: {
      type: String,
      default: "",
      trim: true,
    },
    companyWebsite: {
      type: String,
      default: "",
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      // Auto-strip sensitive/internal fields from every JSON response.
      // No more manual .select("-passwordHash") or sanitizeUser() needed.
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const User = mongoose.model("User", userSchema);

export default User;
