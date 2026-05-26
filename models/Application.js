import mongoose from "mongoose";
import {
  VALID_APPLICATION_STATUSES,
  APPLICATION_STATUS,
} from "../utils/constants.js";

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    seeker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: VALID_APPLICATION_STATUSES,
      default: APPLICATION_STATUS.PENDING,
    },
    coverLetter: {
      type: String,
      maxlength: 2000,
      default: "",
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

// Prevent a seeker from applying to the same job twice
applicationSchema.index({ job: 1, seeker: 1 }, { unique: true });
applicationSchema.index({ seeker: 1 });
applicationSchema.index({ job: 1 });

const Application = mongoose.model("Application", applicationSchema);

export default Application;
