const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/auth");
const {
  enhanceResume,
  getResume,
  getHistory,
  downloadResume,
} = require("../controllers/resumeController");

// Debug: Log what was imported
console.log("Imported functions:", {
  enhanceResume: typeof enhanceResume,
  getResume: typeof getResume,
  getHistory: typeof getHistory,
  downloadResume: typeof downloadResume,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Protected routes
router.post("/enhance", protect, upload.single("resume"), enhanceResume);
router.get("/history", protect, getHistory);
router.get("/:id", protect, getResume);

// Download route (no protect middleware)
router.get("/:id/download", downloadResume);

module.exports = router;