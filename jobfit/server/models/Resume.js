const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  originalFileName: {
    type: String,
    required: true,
  },
  originalContent: {
    type: String,
    required: true,
  },
  enhancedContent: {
    type: String,
    default: "",
  },
  targetCompany: {
    name: String,
    url: String,
    analysis: {
      name: String,
      description: String,
      techStack: [String],
      values: [String],
      culture: String,
      products: [String],
      industry: String,
      jobPostings: [{
        title: String,
        description: String,
      }],
    },
  },
  atsScore: {
    before: {
      type: Number,
      default: 0,
    },
    after: {
      type: Number,
      default: 0,
    },
  },
  keywords: [String],
  suggestions: [String],
  status: {
    type: String,
    enum: ["pending", "analyzing", "scraping", "enhancing", "completed", "failed"],
    default: "pending",
  },
  error: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Resume", resumeSchema);