const Resume = require("../models/Resume");
const scraperService = require("../services/scraperService");
const aiService = require("../services/aiService");
const PDFDocument = require("pdfkit");
const jwt = require("jsonwebtoken");

// ============ PDF PARSER SETUP ============
let pdfParse;
try {
  pdfParse = require("pdf-parse");
} catch (e) {
  console.log("⚠️ pdf-parse not available, using raw extraction");
}

// ============ HELPER FUNCTIONS ============

async function parseFileContent(file) {
  const { mimetype, buffer, originalname } = file;
  console.log(`📄 Parsing: ${originalname} (${mimetype})`);
  
  let text = "";
  
  if (mimetype === "application/pdf") {
    if (pdfParse) {
      try {
        const data = await pdfParse(buffer);
        text = data.text;
        console.log(`✅ PDF parsed: ${text.length} chars`);
      } catch (e) {
        console.log("PDF parse error:", e.message);
        text = extractRawText(buffer);
      }
    } else {
      text = extractRawText(buffer);
    }
  } else if (mimetype.includes("wordprocessingml") || mimetype.includes("officedocument")) {
    try {
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } catch (e) {
      text = extractRawText(buffer);
    }
  } else if (mimetype === "text/plain") {
    text = buffer.toString("utf-8").trim();
  } else {
    text = extractRawText(buffer);
  }

  const finalText = text.trim();
  if (!finalText || finalText.length < 10) {
    return `Resume uploaded: ${originalname}. Content extracted automatically.`;
  }
  return finalText;
}

function extractRawText(buffer) {
  const text = buffer.toString("utf-8");
  return text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim() || "Resume content";
}

// ============ CONTROLLER FUNCTIONS ============

const enhanceResume = async (req, res) => {
  try {
    const { companyUrl } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ success: false, message: "Please upload your resume file" });
    if (!companyUrl) return res.status(400).json({ success: false, message: "Please provide the company website URL" });

    try { new URL(companyUrl); } catch {
      return res.status(400).json({ success: false, message: "Please provide a valid URL" });
    }

    const content = await parseFileContent(file);
    console.log(`📝 Processing ${content.length} characters`);

    const resume = await Resume.create({
      user: req.user._id,
      originalFileName: file.originalname,
      originalContent: content,
      companyUrl,
      status: "pending",
    });

    processResumeAsync(resume._id, content, companyUrl);

    res.status(200).json({ 
      success: true, 
      message: "Resume enhancement started",
      data: { resumeId: resume._id, status: "pending" }
    });

  } catch (error) {
    console.error("❌ Upload error:", error.message);
    res.status(500).json({ success: false, message: "Failed to process resume." });
  }
};

async function processResumeAsync(id, content, url) {
  console.log(`🔄 Processing resume: ${id}`);
  
  try {
    await Resume.findByIdAndUpdate(id, { status: "scraping" });
    const company = await scraperService.researchCompany(url);
    console.log(`✅ Company: ${company.name} | ${company.industry}`);

    await Resume.findByIdAndUpdate(id, { 
      status: "enhancing",
      companyName: company.name,
      companyAnalysis: company,
    });
    
    const result = await aiService.enhanceResume(content, company);

    await Resume.findByIdAndUpdate(id, {
      enhancedContent: JSON.stringify(result),
      fullName: result.fullName || "",
      title: result.title || "",
      email: result.email || "",
      phone: result.phone || "",
      location: result.location || "",
      linkedIn: result.linkedIn || "",
      professionalSummary: result.professionalSummary || "",
      skills: result.skills || [],
      experience: result.experience || [],
      education: result.education || [],
      certifications: result.certifications || [],
      atsScore: {
        before: result.atsScore?.before || 30,
        after: result.atsScore?.after || result.atsScore || 75,
      },
      keywords: result.keywords || [],
      suggestions: result.suggestions || [],
      status: "completed",
    });

    console.log(`✅ Resume completed: ${id}`);

  } catch (error) {
    console.error(`❌ Processing failed: ${id}`, error.message);
    await Resume.findByIdAndUpdate(id, { status: "failed", error: error.message });
  }
}

const getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });
    res.json({ success: true, data: resume });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching resume" });
  }
};

const getHistory = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("-originalContent -enhancedContent");

    res.json({ success: true, count: resumes.length, data: resumes });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching history" });
  }
};

const downloadResume = async (req, res) => {
  try {
    let userId;
    if (req.query.token) {
      try { userId = jwt.verify(req.query.token, process.env.JWT_SECRET).id; }
      catch { return res.status(401).json({ success: false, message: "Invalid token" }); }
    } else if (req.user) {
      userId = req.user._id;
    } else {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const resume = await Resume.findOne({ _id: req.params.id, user: userId });
    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });

    const doc = new PDFDocument({ margins: { top: 50, bottom: 50, left: 60, right: 60 }, size: "A4" });
    const filename = `${resume.fullName || "professional"}-resume.pdf`.replace(/\s+/g, "-").toLowerCase();
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    doc.pipe(res);

    if (resume.fullName) {
      doc.fontSize(24).font("Helvetica-Bold").fillColor("#1a1a2e").text(resume.fullName, { align: "center" });
    }
    if (resume.title) {
      doc.fontSize(12).font("Helvetica").fillColor("#555").text(resume.title, { align: "center" });
    }
    
    const contact = [resume.email, resume.phone, resume.location, resume.linkedIn].filter(Boolean).join("  |  ");
    if (contact) {
      doc.moveDown(0.5);
      doc.fontSize(9).font("Helvetica").fillColor("#777").text(contact, { align: "center" });
    }
    
    doc.moveDown(0.5);
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#4caf50").text(`🎯 ATS Score: ${resume.atsScore?.after || 0}%`, { align: "center" });
    doc.moveDown(1);
    doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor("#ccc").stroke();
    doc.moveDown(1);

    if (resume.professionalSummary) {
      doc.fontSize(13).font("Helvetica-Bold").fillColor("#1a1a2e").text("PROFESSIONAL SUMMARY");
      doc.moveDown(0.3);
      doc.moveTo(60, doc.y).lineTo(200, doc.y).strokeColor("#e94560").stroke();
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica").fillColor("#333").text(resume.professionalSummary, { width: 495, lineGap: 4 });
      doc.moveDown(1);
    }

    if (resume.skills?.length > 0) {
      doc.fontSize(13).font("Helvetica-Bold").fillColor("#1a1a2e").text("TECHNICAL SKILLS");
      doc.moveDown(0.3);
      doc.moveTo(60, doc.y).lineTo(180, doc.y).strokeColor("#e94560").stroke();
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica").fillColor("#333").text(resume.skills.join("  •  "), { width: 495, lineGap: 5 });
      doc.moveDown(1);
    }

    if (resume.experience?.length > 0) {
      doc.fontSize(13).font("Helvetica-Bold").fillColor("#1a1a2e").text("PROFESSIONAL EXPERIENCE");
      doc.moveDown(0.3);
      doc.moveTo(60, doc.y).lineTo(240, doc.y).strokeColor("#e94560").stroke();
      doc.moveDown(0.7);
      for (const exp of resume.experience) {
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#1a1a2e").text(exp.title || "Position");
        const companyLine = [exp.company, exp.dates].filter(Boolean).join("  |  ");
        if (companyLine) doc.fontSize(10).font("Helvetica").fillColor("#e94560").text(companyLine);
        doc.moveDown(0.3);
        if (exp.achievements?.length > 0) {
          for (const achievement of exp.achievements) {
            doc.fontSize(10).font("Helvetica").fillColor("#333").text(`    ▸  ${achievement}`, { width: 480, lineGap: 3 });
          }
        }
        doc.moveDown(0.7);
      }
    }

    if (resume.education?.length > 0) {
      doc.fontSize(13).font("Helvetica-Bold").fillColor("#1a1a2e").text("EDUCATION");
      doc.moveDown(0.3);
      doc.moveTo(60, doc.y).lineTo(160, doc.y).strokeColor("#e94560").stroke();
      doc.moveDown(0.7);
      for (const edu of resume.education) {
        doc.fontSize(10).font("Helvetica-Bold").fillColor("#333").text(edu.degree || "");
        doc.fontSize(10).font("Helvetica").fillColor("#666").text(`${edu.school || ""}  |  ${edu.year || ""}`);
        doc.moveDown(0.3);
      }
    }

    doc.moveDown(1.5);
    doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor("#e0e0e0").stroke();
    doc.moveDown(0.5);
    doc.fontSize(7).font("Helvetica").fillColor("#aaa").text("Generated by JobFit AI", { align: "center" });
    doc.end();
    console.log(`📥 PDF downloaded: ${filename}`);

  } catch (error) {
    console.error("❌ Download error:", error.message);
    res.status(500).json({ success: false, message: "Error generating PDF" });
  }
};

// 🔴 DELETE RESUME
const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    console.log(`🗑️ Deleted: ${req.params.id}`);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔴 RE-ENHANCE RESUME
const reEnhanceResume = async (req, res) => {
  try {
    const { companyUrl } = req.body;
    if (!companyUrl) return res.status(400).json({ message: "Please provide company URL" });

    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    if (!resume.originalContent) return res.status(400).json({ message: "No original content found" });

    await Resume.findByIdAndUpdate(req.params.id, {
      companyUrl,
      status: "pending",
      enhancedContent: "",
    });

    processResumeAsync(req.params.id, resume.originalContent, companyUrl);

    res.json({ success: true, message: "Re-enhancement started", data: { resumeId: req.params.id } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  enhanceResume,
  getResume,
  getHistory,
  downloadResume,
  deleteResume,
  reEnhanceResume,
};

console.log("✅ Resume controller loaded");