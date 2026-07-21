const Resume = require("../models/Resume");
const scraperService = require("../services/scraperService");
const aiService = require("../services/aiService");
const PDFDocument = require("pdfkit");
const jwt = require("jsonwebtoken");

// ============ HELPER FUNCTIONS ============
async function parseFileContent(file) {
  const { mimetype, buffer, originalname } = file;
  console.log(`📄 Parsing: ${originalname}`);
  
  // Try to extract text
  let text = "";
  
  // For PDF
  if (mimetype === "application/pdf") {
    try {
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      text = data.text;
    } catch (e) {
      text = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
    }
  }
  // For DOCX
  else if (mimetype.includes("wordprocessingml")) {
    try {
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } catch (e) {
      text = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
    }
  }
  // For TXT
  else {
    text = buffer.toString("utf-8");
  }

  return text.trim() || "Resume content";
}

// ============ CONTROLLER FUNCTIONS ============

const enhanceResume = async (req, res) => {
  try {
    const { companyUrl } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "Please upload resume" });
    if (!companyUrl) return res.status(400).json({ message: "Please provide company URL" });

    const content = await parseFileContent(file);
    
    if (content.length < 50) {
      return res.status(400).json({ message: "Resume too short" });
    }

    const resume = await Resume.create({
      user: req.user._id,
      originalFileName: file.originalname,
      originalContent: content,
      companyUrl,
      status: "pending",
    });

    // Process in background
    (async () => {
      try {
        await Resume.findByIdAndUpdate(resume._id, { status: "scraping" });
        const company = await scraperService.researchCompany(companyUrl);

        await Resume.findByIdAndUpdate(resume._id, {
          status: "enhancing",
          companyName: company.name,
          companyAnalysis: company,
        });

        const result = await aiService.enhanceResume(content, company);

        await Resume.findByIdAndUpdate(resume._id, {
          enhancedContent: result.enhancedResume,
          atsScore: result.atsScore,
          keywords: result.keywords,
          suggestions: result.suggestions,
          status: "completed",
        });
      } catch (error) {
        await Resume.findByIdAndUpdate(resume._id, {
          status: "failed",
          error: error.message,
        });
      }
    })();

    res.json({ success: true, data: { resumeId: resume._id } });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ message: "Not found" });
    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id })
      .sort("-createdAt")
      .select("-originalContent -enhancedContent");
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const downloadResume = async (req, res) => {
  try {
    // Get user from query token
    let userId;
    if (req.query.token) {
      try {
        const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
      }
    } else if (req.user) {
      userId = req.user._id;
    } else {
      return res.status(401).json({ message: "Authentication required" });
    }

    const resume = await Resume.findOne({ _id: req.params.id, user: userId });
    if (!resume?.enhancedContent) {
      return res.status(404).json({ message: "Not found" });
    }

    // Generate simple PDF
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=resume.pdf");
    doc.pipe(res);
    doc.fontSize(16).text("Enhanced Resume", { align: "center" });
    doc.moveDown();
    doc.fontSize(11).text(resume.enhancedContent);
    doc.end();

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Make sure ALL functions are exported
module.exports = {
  enhanceResume,
  getResume,
  getHistory,
  downloadResume,
};

// Debug log
console.log("✅ Controller exports:", Object.keys(module.exports));