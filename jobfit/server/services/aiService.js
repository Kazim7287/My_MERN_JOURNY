console.log("🔍 aiService loading...");
console.log("🔍 GROQ_API_KEY:", process.env.GROQ_API_KEY ? "FOUND" : "NOT FOUND");

const https = require("https");

class AIService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.useAI = !!(this.apiKey && this.apiKey.length > 10);
    console.log(this.useAI ? "✅ Groq AI ready" : "⚠️ Template mode");
  }

  async enhanceResume(content, company) {
    console.log("🔍 enhanceResume called - useAI:", this.useAI);
    
    if (this.useAI) {
      try {
        console.log("🤖 Calling Groq AI...");
        const jsonResume = await this.callGroqAPI(content, company);
        console.log("✅ AI enhancement successful");
        return this.buildResumeObject(jsonResume, company);
      } catch (error) {
        console.log("⚠️ Groq failed:", error.message);
      }
    }
    
    console.log("📝 Using template mode");
    return this.templateResume(content, company);
  }

  callGroqAPI(content, company) {
    return new Promise((resolve, reject) => {
    const prompt = `Convert this resume to JSON for ${company.name} (${company.industry}). Return ONLY JSON, no other text.

Company: ${company.name}
Industry: ${company.industry}
Tech: ${company.techStack?.join(", ") || "Various"}
Values: ${company.values?.join(", ") || "Professional Excellence"}

Resume:
${content}

IMPORTANT: Return ONLY the JSON object below. No markdown, no backticks, no explanation.

{"fullName":"Name","title":"Title","email":"email@email.com","phone":"","location":"","linkedIn":"","professionalSummary":"ATS-optimized summary here","skills":["Skill1","Skill2","Skill3","Skill4","Skill5","Skill6","Skill7","Skill8"],"experience":[{"title":"Job Title","company":"Company","dates":"2020-Present","achievements":["Achievement with 30% metric","Achievement with metric","Achievement with metric"]}],"education":[{"degree":"Degree","school":"University","year":"2020"}],"certifications":[],"atsScore":90}`;

      const data = JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are a JSON generator. Return ONLY valid JSON. No markdown, no backticks, no explanations." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 4096,
      });

      const req = https.request({
        hostname: "api.groq.com",
        path: "/openai/v1/chat/completions",
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }, (res) => {
        let body = "";
        res.on("data", chunk => body += chunk);
        res.on("end", () => {
          try {
            const result = JSON.parse(body);
            let jsonText = result.choices?.[0]?.message?.content || "";
            jsonText = jsonText.replace(/```json\n?|```/g, "").trim();
            const parsed = JSON.parse(jsonText);
            console.log("✅ AI JSON parsed successfully");
            resolve(parsed);
          } catch (e) {
            console.log("JSON parse failed, using template");
            reject(e);
          }
        });
      });

      req.on("error", reject);
      req.write(data);
      req.end();
    });
  }

  buildResumeObject(jsonResume, company) {
    const skills = [...(jsonResume.skills || []), ...(company.techStack || [])];
    const uniqueSkills = [...new Set(skills)].slice(0, 12);

    return {
      fullName: jsonResume.fullName || "Professional",
      title: jsonResume.title || `Senior ${company.industry || "Technology"} Professional`,
      email: jsonResume.email || "",
      phone: jsonResume.phone || "",
      location: jsonResume.location || "",
      linkedIn: jsonResume.linkedIn || "",
      professionalSummary: jsonResume.professionalSummary || "",
      skills: uniqueSkills,
      experience: jsonResume.experience || [],
      education: jsonResume.education || [],
      certifications: jsonResume.certifications || [],
      atsScore: { before: 40, after: jsonResume.atsScore || this.calcScore(JSON.stringify(jsonResume)) },
      keywords: [...(company.techStack || []), ...(company.values || [])],
      suggestions: [
        "Add more quantifiable metrics (%, numbers, timeframes)",
        "Use stronger action verbs: spearheaded, optimized, engineered",
        "Tailor your professional summary to match " + (company.name || "company") + "'s mission",
      ],
    };
  }

  templateResume(content, company) {
    const nameMatch = content.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m);
    const emailMatch = content.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    const phoneMatch = content.match(/\+?[\d\-\(\) ]{10,}/);
    
    // 🔴 Extract real skills from the original resume
    const extractedSkills = this.extractSkillsFromResume(content);
    const companyTech = company.techStack || [];
    const allSkills = [...new Set([...extractedSkills, ...companyTech])].slice(0, 10);
    
    const values = company.values || ["Innovation", "Excellence", "Collaboration"];
    const industry = company.industry || "Technology";
    const companyName = company.name || "the company";

    // 🔴 Extract real experience from original resume
    const extractedExperience = this.extractExperienceFromResume(content, companyName);
    const extractedEducation = this.extractEducationFromResume(content);

    return {
      fullName: nameMatch?.[1] || "Professional Candidate",
      title: `Senior ${industry} Professional`,
      email: emailMatch?.[0] || "candidate@email.com",
      phone: phoneMatch?.[0] || "",
      location: "",
      linkedIn: "",
      professionalSummary: `Results-driven ${industry} professional with 7+ years of experience in ${allSkills.slice(0, 4).join(", ")}. Proven track record of delivering innovative solutions at scale. Committed to ${values.slice(0, 2).join(" and ")}, with a focus on driving measurable business outcomes through technical excellence and strategic leadership.`,
      skills: allSkills,
      experience: extractedExperience.length > 0 ? extractedExperience : [
        {
          title: "Senior Professional",
          company: companyName,
          dates: "2020 - Present",
          achievements: [
            `Spearheaded ${allSkills[0] || "technology"} initiative resulting in 30% efficiency improvement`,
            `Led cross-functional team of 10+ delivering high-impact solutions`,
            "Implemented best practices reducing deployment time by 40%",
            `Drove innovation aligned with ${values[0] || "excellence"} standards`,
          ],
        },
      ],
      education: extractedEducation.length > 0 ? extractedEducation : [
        { degree: "Bachelor of Science in Computer Science", school: "University", year: "2017" },
      ],
      certifications: [],
      atsScore: { before: this.calcScore(content), after: Math.min(this.calcScore(content) + 25, 92) },
      keywords: allSkills,
      suggestions: [
        "Add specific metrics: 'Increased revenue by X%', 'Managed team of X people'",
        "Use more action verbs: spearheaded, optimized, engineered, delivered",
        "Quantify your achievements with real numbers and percentages",
      ],
    };
  }

  // 🔴 NEW: Extract skills from original resume
  extractSkillsFromResume(content) {
    const skillKeywords = [
      "JavaScript", "Python", "Java", "C++", "C#", "React", "Angular", "Vue",
      "Node.js", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "MongoDB",
      "PostgreSQL", "MySQL", "Git", "Linux", "Agile", "Scrum", "TypeScript",
      "Machine Learning", "AI", "Data Science", "DevOps", "CI/CD",
      "Project Management", "Team Leadership", "Communication", "SQL",
      "HTML", "CSS", "REST API", "GraphQL", "Microservices", "Jenkins",
      "Excel", "Tableau", "Power BI", "Digital Marketing", "SEO",
    ];
    
    const found = skillKeywords.filter(skill => 
      content.toLowerCase().includes(skill.toLowerCase())
    );
    
    return found.length > 0 ? found : [];
  }

  // 🔴 NEW: Extract experience from original resume
  extractExperienceFromResume(content, companyName) {
    const experiences = [];
    
    // Look for experience section
    const expMatch = content.match(/(?:EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT)([\s\S]*?)(?:EDUCATION|SKILLS|CERTIFICATION|$)/i);
    
    if (expMatch) {
      const expText = expMatch[1];
      // Find job titles (lines with common job keywords)
      const lines = expText.split("\n").filter(l => l.trim());
      let currentExp = null;
      
      for (const line of lines) {
        const trimmed = line.trim();
        // Check if this line looks like a job title
        if (/engineer|developer|manager|director|analyst|designer|lead|architect/i.test(trimmed) && trimmed.length < 60) {
          if (currentExp) experiences.push(currentExp);
          currentExp = {
            title: trimmed,
            company: companyName,
            dates: "",
            achievements: [],
          };
        } else if (currentExp && trimmed.length > 10) {
          currentExp.achievements.push(trimmed.replace(/^[•\-\*\s]+/, ""));
        }
      }
      if (currentExp) experiences.push(currentExp);
    }
    
    return experiences.slice(0, 2);
  }

  // 🔴 NEW: Extract education from original resume
  extractEducationFromResume(content) {
    const education = [];
    
    const eduMatch = content.match(/(?:EDUCATION|ACADEMIC)([\s\S]*?)(?:EXPERIENCE|SKILLS|CERTIFICATION|$)/i);
    
    if (eduMatch) {
      const eduText = eduMatch[1];
      const lines = eduText.split("\n").filter(l => l.trim());
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (/bachelor|master|phd|degree|diploma|b\.s\.|m\.s\.|b\.a\.|m\.a\./i.test(trimmed) && trimmed.length < 100) {
          education.push({
            degree: trimmed,
            school: "University",
            year: "",
          });
        }
      }
    }
    
    return education.slice(0, 2);
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
    return Math.min(score, 90);
  }
}

module.exports = new AIService();