const Note = require("../models/Note");

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
  try {
    const { title, description, completed } = req.body;

    // Validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Please provide both title and description",
      });
    }

    const note = await Note.create({
      user: req.user._id, // Associate note with logged-in user
      title,
      description,
      completed: completed || false,
    });

    res.status(201).json({
      success: true,
      message: "Note created successfully",
      data: note,
    });
  } catch (error) {
    console.error("Create note error:", error);
    
    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating note",
    });
  }
};

// @desc    Get all notes for logged-in user
// @route   GET /api/notes
// @access  Private
const getAllNotes = async (req, res) => {
  try {
    // Only fetch notes belonging to the logged-in user
    const notes = await Note.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    console.error("Get all notes error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching notes",
    });
  }
};

// @desc    Get single note by ID
// @route   GET /api/notes/:id
// @access  Private
const getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user._id, // Ensure user can only access their own notes
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error("Get note by ID error:", error);
    
    // Handle invalid ObjectId
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while fetching note",
    });
  }
};

// @desc    Update note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res) => {
  try {
    const { title, description, completed } = req.body;

    // Find note belonging to user
    let note = await Note.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found or unauthorized",
      });
    }

    // Update fields
    note.title = title || note.title;
    note.description = description || note.description;
    if (completed !== undefined) {
      note.completed = completed;
    }

    // Save with validation
    const updatedNote = await note.save();

    res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data: updatedNote,
    });
  } catch (error) {
    console.error("Update note error:", error);
    
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating note",
    });
  }
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id, // Ensure user can only delete their own notes
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Delete note error:", error);
    
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while deleting note",
    });
  }
};

module.exports = {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
};