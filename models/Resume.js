import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    education: [
      {
        school: { type: String, default: "" },
        degree: { type: String, default: "" },
        year: { type: String, default: "" },
      },
    ],
    experience: [
      {
        company: { type: String, default: "" },
        role: { type: String, default: "" },
        duration: { type: String, default: "" },
        description: { type: String, default: "" },
      },
    ],
    portfolio: [
      {
        title: { type: String, default: "" },
        link: { type: String, default: "" },
      },
    ],
    languages: [
      {
        language: { type: String, default: "" },
        level: { type: String, default: "" },
      },
    ],
    references: [
      {
        name: { type: String, default: "" },
        relation: { type: String, default: "" },
        phone: { type: String, default: "" },
        email: { type: String, default: "" },
      },
    ],
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

const Resume = mongoose.model("Resume", resumeSchema);

export default Resume;
