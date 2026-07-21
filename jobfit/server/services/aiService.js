const https = require("https");

class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.useAI = false;
    this.modelPath = null;
    
    if (this.apiKey && this.apiKey.length > 10) {
      console.log("🔑 API key found, testing connection...");
      this.findWorkingModel().then(path => {
        if (path) {
          this.modelPath = path;
          this.useAI = true;
          console.log(`✅ AI ready (${path})`);
        } else {
          console.log("ℹ️ No working model found, using template mode");
        }
      });
    } else {
      console.log("ℹ️ No API key, using template mode");
    }
  }

  async findWorkingModel() {
    // Try different model paths
    const models = [
      "/v1/models/gemini-pro:generateContent",
      "/v1beta/models/gemini-pro:generateContent",
      "/v1beta/models/gemini-1.0-pro:generateContent",
      "/v1beta/models/gemini-1.5-flash:generateContent",
      "/v1/models/gemini-1.5-flash:generateContent",
    ];

    for (const model of models) {
      try {
        console.log(`  Testing: ${model}...`);
        await this.testModel(model);
        return model;
      } catch (error) {
        console.log(`  ❌ ${model}: ${error.message}`);
      }
    }
    return null;
  }

  testModel(path) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        contents: [{ parts: [{ text: "Hi" }] }]
      });

      const options = {
        hostname: "generativelanguage.googleapis.com",
        path: `${path}?key=${this.apiKey}`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      };

      const req = https.request(options, (res) => {
        let body = "";
        res.on("data", chunk => body += chunk);
        res.on("end", () => {
          try {
            const result = JSON.parse(body);
            if (result.error) {
              reject(new Error(result.error.message));
            } else {
              resolve(true);
            }
          } catch (e) {
            reject(new Error("Invalid response"));
          }
        });
      });

      req.on("error", reject);
      req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
      req.write(data);
      req.end();
    });
  }

  async enhanceResume(content, company) {
    if (this.useAI && this.modelPath) {
      try {
        console.log("🤖 Calling Gemini AI...");
        return await this.aiEnhance(content, company);
      } catch (error) {
        console.log("⚠️ AI failed:", error.message);
      }
    }
    console.log("📝 Using template enhancement...");
    return this.templateEnhance(content, company);
  }

  async aiEnhance(content, company) {
    const prompt = `You are an expert ATS resume optimizer. Enhance the following resume for ${company.name}, a ${company.industry} company.

Company Details:
- Industry: ${company.industry}
- Tech Stack: ${company.techStack?.join(", ") || "Various"}
- Values: ${company.values?.join(", ") || "Professional Excellence"}
- Culture: ${company.culture || "Professional environment"}

Original Resume:
${content}

TASK: Create an ATS-optimized version that:
1. Has a strong professional summary aligned with company values
2. Naturally incorporates relevant keywords from their tech stack
3. Uses powerful action verbs and quantifies achievements
4. Is well-structured with clear sections
5. Is tailored specifically for ${company.name}

Return ONLY the enhanced resume text.`;

    const enhanced = await this.makeRequest(prompt);
    
    const beforeScore = this.calcScore(content);
    const afterScore = this.calcScore(enhanced);

    return {
      enhancedResume: enhanced,
      atsScore: { before: beforeScore, after: afterScore },
      keywords: company.techStack?.filter(k => 
        enhanced.toLowerCase().includes(k.toLowerCase())
      ) || [],
      suggestions: [
        "Add more quantifiable metrics (%, numbers, timeframes)",
        "Tailor your experience descriptions to match company culture",
        "Use industry-specific terminology from their tech stack",
      ],
    };
  }

  makeRequest(prompt) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      });

      const options = {
        hostname: "generativelanguage.googleapis.com",
        path: `${this.modelPath}?key=${this.apiKey}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      };

      const req = https.request(options, (res) => {
        let body = "";
        res.on("data", chunk => body += chunk);
        res.on("end", () => {
          try {
            const result = JSON.parse(body);
            
            if (result.error) {
              reject(new Error(result.error.message));
              return;
            }

            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              resolve(text);
            } else {
              reject(new Error("No text in response"));
            }
          } catch (error) {
            reject(new Error("Failed to parse API response"));
          }
        });
      });

      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("API request timeout"));
      });

      req.write(data);
      req.end();
    });
  }

  templateEnhance(content, company) {
    let enhanced = content;
    const techStack = company.techStack || [];
    const values = company.values || [];
    const industry = company.industry || "Technology";

    // Add professional summary
    if (!content.match(/summary|objective/i)) {
      const skills = techStack.slice(0, 4).join(", ") || "various technologies";
      const val = values.slice(0, 2).join(" and ") || "excellence";
      
      enhanced = `PROFESSIONAL SUMMARY\nResults-driven ${industry} professional with expertise in ${skills}. Proven track record of delivering innovative solutions with a focus on ${val}. Adept at driving business growth through technical excellence and strategic leadership.\n\n${enhanced}`;
    }

    // Add skills section
    if (techStack.length > 0) {
      const existing = enhanced.toLowerCase();
      const newSkills = techStack.filter(t => !existing.includes(t.toLowerCase()));
      if (newSkills.length > 0) {
        enhanced += `\n\nTECHNICAL SKILLS\n${techStack.join(" • ")}`;
      }
    }

    // Add competencies
    if (values.length > 0) {
      enhanced += `\n\nCORE COMPETENCIES\n${[...values, ...techStack.slice(0, 3)].join(" • ")}`;
    }

    const before = this.calcScore(content);
    const after = this.calcScore(enhanced);

    return {
      enhancedResume: enhanced,
      atsScore: { before, after },
      keywords: [...techStack, ...values],
      suggestions: [
        "Add specific metrics: 'Increased revenue by X%', 'Led team of X'",
        "Use action verbs: implemented, achieved, optimized, spearheaded",
        "Quantify your achievements with real numbers",
      ],
    };
  }

  calcScore(text) {
    let score = 30;
    const t = text.toLowerCase();
    
    if (t.includes("summary")) score += 10;
    if (t.includes("skill") || t.includes("competenc")) score += 10;
    if (t.includes("experience")) score += 10;
    if (t.includes("education")) score += 5;
    if (/\d+%/.test(text)) score += 10;
    if (/\d+ years|\$\d+|\d+ million/.test(text)) score += 10;
    if (text.length > 500) score += 8;
    if (text.length > 1000) score += 7;
    
    return Math.min(score, 95);
  }
}

module.exports = new AIService();