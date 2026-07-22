const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/auth");
const {
  enhanceResume,
  getResume,
  getHistory,
  downloadResume,
  deleteResume,
  reEnhanceResume,
} = require("../controllers/resumeController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// All routes require authentication
router.use(protect);

// CRUD Routes
router.post("/enhance", upload.single("resume"), enhanceResume);
router.get("/history", getHistory);
router.get("/:id", getResume);
router.get("/:id/download", downloadResume);
router.delete("/:id", deleteResume);
router.post("/:id/re-enhance", reEnhanceResume);

module.exports = router;