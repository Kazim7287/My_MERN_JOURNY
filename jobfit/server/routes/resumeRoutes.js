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

// 🔴 REMOVE THIS LINE:
// router.use(protect);

// 🔴 Add protect individually to routes that need it:
router.post("/enhance", protect, upload.single("resume"), enhanceResume);
router.get("/history", protect, getHistory);
router.get("/:id", protect, getResume);

// 🔴 DOWNLOAD - NO protect middleware (uses query token instead)
router.get("/:id/download", downloadResume);

router.delete("/:id", protect, deleteResume);
router.post("/:id/re-enhance", protect, reEnhanceResume);

module.exports = router;