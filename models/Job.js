import mongoose from "mongoose";
import { JOB_TYPES, VALID_JOB_STATUSES, JOB_STATUS } from "../utils/constants.js";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: JOB_TYPES,
      required: true,
    },
    salary: {
      type: Number,
      min: 0,
    },
    skills: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: VALID_JOB_STATUSES,
      default: JOB_STATUS.OPEN,
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── Indexes for search & filter performance ────────────────────────────────
jobSchema.index({ location: 1 });
jobSchema.index({ type: 1 });
jobSchema.index({ salary: 1 });
jobSchema.index({ employer: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ title: "text", description: "text" });

const Job = mongoose.model("Job", jobSchema);

export default Job;
