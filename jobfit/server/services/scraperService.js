const puppeteer = require("puppeteer");

class ScraperService {
  async researchCompany(url) {
    console.log("🔍 Starting company research...");
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-web-security",
          "--disable-features=IsolateOrigins,site-per-process",
        ],
      });

      const page = await browser.newPage();
      
      // Set a realistic user agent
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Block unnecessary resources to speed up loading
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        const resourceType = request.resourceType();
        if (resourceType === "image" || 
            resourceType === "stylesheet" || 
            resourceType === "font" ||
            resourceType === "media") {
          request.abort();
        } else {
          request.continue();
        }
      });

      console.log(`🌐 Navigating to: ${url}`);
      
      // 🔴 FIX: Use domcontentloaded instead of networkidle2, and reduce timeout
      try {
        await page.goto(url, { 
          waitUntil: "domcontentloaded", // Faster than networkidle2
          timeout: 15000 // 15 seconds timeout
        });
      } catch (navError) {
        console.warn("⚠️ Navigation timeout, using partial content...");
        // Continue with whatever loaded
      }

      // Wait a bit for any remaining content
      await page.waitForTimeout(2000);

      // Get all visible text
      const pageText = await page.evaluate(() => {
        return document.body ? document.body.innerText : "";
      });

      // Get meta tags
      const metaTags = await page.evaluate(() => {
        const metas = document.getElementsByTagName("meta");
        const metaData = {};
        for (let meta of metas) {
          const name = meta.getAttribute("name") || meta.getAttribute("property");
          const content = meta.getAttribute("content");
          if (name && content) {
            metaData[name] = content;
          }
        }
        return metaData;
      });

      // Get title
      const title = await page.evaluate(() => document.title || "");

      console.log(`📄 Extracted ${pageText.length} characters of text`);

      // Extract company info
      const companyInfo = {
        name: this.extractCompanyName(metaTags, title, pageText),
        description: metaTags["description"] || metaTags["og:description"] || this.extractDescription(pageText),
        industry: this.detectIndustry(pageText),
        techStack: this.detectTechStack(pageText),
        values: this.extractValues(pageText),
        culture: this.extractCulture(pageText),
        products: this.extractProducts(pageText),
      };

      console.log(`✅ Company research completed: ${companyInfo.name}`);
      console.log(`   Industry: ${companyInfo.industry}`);
      console.log(`   Tech Stack: ${companyInfo.techStack?.length || 0} technologies found`);

      return companyInfo;

    } catch (error) {
      console.error("❌ Scraping failed:", error.message);
      
      // Return basic info even if scraping fails
      return {
        name: this.extractDomainName(url),
        description: "Company website",
        industry: "Technology",
        techStack: [],
        values: ["Professionalism", "Innovation"],
        culture: "Professional work environment",
        products: [],
      };
    } finally {
      if (browser) {
        await browser.close();
        console.log("🔒 Browser closed");
      }
    }
  }

  extractCompanyName(metaTags, title, pageText) {
    // Try multiple sources for company name
    const name = metaTags["og:site_name"] || 
                 metaTags["application-name"] ||
                 (title ? title.split("|")[0].split("-")[0].trim() : "") ||
                 pageText.split("\n")[0]?.trim();
    
    return name || "Company";
  }

  extractDomainName(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace("www.", "").split(".")[0];
    } catch {
      return "Company";
    }
  }

  extractDescription(pageText) {
    const lines = pageText.split("\n").filter(line => line.trim().length > 30);
    return lines[0] || "A technology company";
  }

  detectIndustry(pageText) {
    const text = pageText.toLowerCase();
    const industries = {
      "Healthcare": ["healthcare", "medical", "hospital", "patient", "clinical", "health"],
      "Finance": ["finance", "banking", "investment", "insurance", "trading", "fintech"],
      "Technology": ["software", "technology", "cloud", "digital", "platform", "tech", "saas"],
      "Education": ["education", "learning", "teaching", "student", "academic", "school"],
      "E-commerce": ["ecommerce", "online shopping", "retail", "marketplace", "shop"],
      "Manufacturing": ["manufacturing", "production", "factory", "industrial"],
      "Consulting": ["consulting", "advisory", "strategy", "solutions", "services"],
      "Media": ["media", "entertainment", "content", "streaming", "publishing"],
      "Real Estate": ["real estate", "property", "housing", "commercial"],
      "Energy": ["energy", "power", "solar", "renewable", "oil", "gas"],
    };

    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return industry;
      }
    }

    return "Technology";
  }

  detectTechStack(pageText) {
    const text = pageText.toLowerCase();
    const technologies = [
      // Frontend
      "React", "Angular", "Vue.js", "Next.js", "TypeScript", "JavaScript",
      "HTML5", "CSS3", "SASS", "Tailwind CSS", "Bootstrap",
      // Backend
      "Node.js", "Python", "Java", "Kotlin", "Go", "Rust", "Ruby",
      "PHP", "C#", ".NET", "Spring Boot", "Django", "Flask",
      // Cloud & DevOps
      "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform",
      "Jenkins", "CI/CD", "GitHub Actions", "DevOps",
      // Databases
      "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch",
      "DynamoDB", "Cassandra", "Oracle",
      // AI/ML
      "Machine Learning", "AI", "TensorFlow", "PyTorch", "Data Science",
      "NLP", "Computer Vision", "Deep Learning",
      // Mobile
      "React Native", "Flutter", "iOS", "Android", "Swift",
      // Other
      "GraphQL", "REST API", "Microservices", "Serverless",
      "Blockchain", "IoT", "AR/VR",
    ];

    const found = technologies.filter(tech => 
      text.includes(tech.toLowerCase())
    );

    return found.length > 0 ? found : ["JavaScript", "Python", "Cloud"];
  }

  extractValues(pageText) {
    const text = pageText.toLowerCase();
    const values = [
      "Innovation", "Integrity", "Collaboration", "Excellence",
      "Diversity", "Inclusion", "Sustainability", "Customer First",
      "Agile", "Transparency", "Accountability", "Passion",
      "Teamwork", "Growth Mindset", "Quality", "Trust",
      "Respect", "Empowerment", "Creativity", "Leadership",
    ];

    const found = values.filter(value => 
      text.includes(value.toLowerCase())
    );

    return found.length > 0 ? found : ["Innovation", "Excellence", "Collaboration"];
  }

  extractCulture(pageText) {
    const cultureKeywords = [
      "culture", "values", "mission", "vision", "team",
      "work environment", "benefits", "diversity", "inclusion",
      "work-life", "remote", "hybrid", "office",
    ];

    const sentences = pageText.split(/[.!?]+/);
    const cultureSentences = sentences.filter(sentence =>
      cultureKeywords.some(keyword => 
        sentence.toLowerCase().includes(keyword)
      )
    );

    return cultureSentences.length > 0 
      ? cultureSentences.slice(0, 3).join(". ").trim()
      : "Professional and collaborative work environment";
  }

  extractProducts(pageText) {
    const productKeywords = [
      "product", "service", "platform", "solution", "feature",
      "offering", "application", "tool",
    ];

    const sentences = pageText.split(/[.!?]+/);
    const productSentences = sentences.filter(sentence =>
      productKeywords.some(keyword => 
        sentence.toLowerCase().includes(keyword)
      )
    );

    return productSentences.length > 0 
      ? productSentences.slice(0, 5).map(s => s.trim())
      : ["Technology products and services"];
  }
}

module.exports = new ScraperService();