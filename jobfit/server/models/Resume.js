const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  originalFileName: String,
  originalContent: String,
  enhancedContent: String,
  companyUrl: String,
  companyName: String,
  
  fullName: String,
  title: String,
  email: String,
  phone: String,
  location: String,
  linkedIn: String,
  professionalSummary: String,
  skills: [String],
  experience: [{
    title: String,
    company: String,
    dates: String,
    achievements: [String],
  }],
  education: [{
    degree: String,
    school: String,
    year: String,
  }],
  certifications: [{
    name: String,
    issuer: String,
    year: String,
  }],
  
  companyAnalysis: {
    industry: String,
    techStack: [String],
    values: [String],
    culture: String,
    description: String,
  },
  atsScore: {
    before: { type: Number, default: 0 },
    after: { type: Number, default: 0 },
  },
  keywords: [String],
  suggestions: [String],
  status: {
    type: String,
    enum: ["pending", "scraping", "enhancing", "completed", "failed"],
    default: "pending",
  },
}, { timestamps: true });

module.exports = mongoose.model("Resume", resumeSchema);