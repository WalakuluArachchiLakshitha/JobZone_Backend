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

    // ── NIC (National Identity Card) ─────────────────────────
    nic: {
      type: String,
      default: "",
      trim: true,
    },

    // ── Personal info ─────────────────────────────────────────
    firstName: {
      type: String,
      default: "",
      trim: true,
    },
    lastName: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 2000,
    },
    avatar: {
      type: String,
      default: "",
    },

    // ── Location breakdown ────────────────────────────────────
    location: {
      type: String,
      default: "",
      trim: true,
    },
    country: {
      type: String,
      default: "",
      trim: true,
    },
    region: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
    },

    // ── Social links ──────────────────────────────────────────
    website: {
      type: String,
      default: "",
    },
    linkedin: {
      type: String,
      default: "",
    },
    github: {
      type: String,
      default: "",
    },
    twitter: {
      type: String,
      default: "",
    },
    facebook: {
      type: String,
      default: "",
    },

    // ── Summary fields ────────────────────────────────────────
    experience: {
      type: String,
      default: "",
    },
    education: {
      type: String,
      default: "",
    },

    // ── Seeker fields ─────────────────────────────────────────
    skills: {
      type: [String],
      default: [],
    },
    availability: {
      type: String,
      enum: AVAILABILITY_OPTIONS,
      default: "",
    },
    resumeUrl: {
      type: String,
      default: "",
    },

    // ── Employer fields ───────────────────────────────────────
    companyName: {
      type: String,
      default: "",
      trim: true,
    },
    companyWebsite: {
      type: String,
      default: "",
    },
    companyAddress: {
      type: String,
      default: "",
      trim: true,
    },
    companyBR: {
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

