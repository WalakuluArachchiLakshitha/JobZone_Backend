import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      default: "",
    },
    industry: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      default: "",
    },
    founded: {
      type: Number,
    },
    description: {
      type: String,
      default: "",
      maxlength: 3000,
    },
    website: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    openPositions: {
      type: Number,
      default: 0,
    },
    benefits: {
      type: [String],
      default: [],
    },
    culture: {
      type: String,
      default: "",
    },
    // Link to the employer user who owns this company profile
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

companySchema.index({ location: 1 });
companySchema.index({ industry: 1 });
companySchema.index({ name: "text", industry: "text" });

const Company = mongoose.model("Company", companySchema);

export default Company;
