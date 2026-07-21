const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [5, "Description must be at least 5 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for better performance when querying user's notes
noteSchema.index({ user: 1, createdAt: -1 });
noteSchema.index({ title: "text", description: "text" }); // For future search functionality

const Note = mongoose.model("Note", noteSchema);

module.exports = Note;