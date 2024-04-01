import mongoose, { Schema } from "mongoose";

const websiteSchema = new Schema({
  url: {
    type: String,
    required: true,
    description: "The complete website URL",
    unique: true,
    index: true,
  },
  source: {
    type: String,
    default: "Data not found",
    description:
      "Classification of the website based on user input or pre-defined rules",
    enum: [
      "Potential Source",
      "Review Needed",
      "Community Source",
      "Data not found",
    ],
  },
  userReviewPotentialSource: {
    type: Number,
    required: false,
  },
  userReviewReviewNeeded: {
    type: Number,
    required: false,
  },
  aiAnalysis: {
    type: String,
    default: "Data not found",
    description: "Classification of the website based on ai pre-defined rules",
    enum: [
      "Potential Source",
      "Review Needed",
      "Community Source",
      "Data not found",
    ],
  },
  trafficData: {
    estimatedTraffic: {
      type: Number,
      description: "Estimated number of website visitors",
    },
    recordedDate: {
      type: Date,
      description: "Recorded Date to collect traffic data.",
    },
  },
});

export default mongoose.model("Website", websiteSchema);
