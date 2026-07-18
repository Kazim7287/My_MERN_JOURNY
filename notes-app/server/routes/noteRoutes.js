const express = require("express");
const router = express.Router();

const {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
} = require("../controllers/noteController");

// Routes
router.route("/")
  .get(getAllNotes)      // GET /api/notes
  .post(createNote);     // POST /api/notes

router.route("/:id")
  .get(getNoteById)      // GET /api/notes/:id
  .put(updateNote)       // PUT /api/notes/:id
  .delete(deleteNote);   // DELETE /api/notes/:id

module.exports = router;