import mongoose from "mongoose";

const jobAlertSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    frequency: {
      type: String,
      enum: ["Weekly", "Monthly"],
      default: "Weekly",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("JobAlert", jobAlertSchema);
