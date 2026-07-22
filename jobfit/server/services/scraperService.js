const https = require("https");
const http = require("http");

// 🔴 COMPANY DATABASE - Known companies with accurate info
const KNOWN_COMPANIES = {
  "github": {
    name: "GitHub",
    industry: "Technology",
    techStack: ["Git", "Ruby", "JavaScript", "Python", "Docker", "Kubernetes", "GraphQL", "AWS", "REST API", "CI/CD", "TypeScript", "React"],
    values: ["Collaboration", "Open Source", "Developer First", "Innovation", "Inclusion"],
    culture: "Remote-first, collaborative environment focused on developer tools and open source community",
  },
  "microsoft": {
    name: "Microsoft",
    industry: "Technology",
    techStack: ["Azure", "C#", ".NET", "TypeScript", "Python", "AI", "Cloud", "React", "Windows", "Office 365"],
    values: ["Innovation", "Diversity", "Inclusion", "Growth Mindset", "Accountability"],
    culture: "Growth mindset culture with focus on innovation and global impact",
  },
  "google": {
    name: "Google",
    industry: "Technology",
    techStack: ["Python", "Java", "Go", "AI", "Cloud", "Kubernetes", "TensorFlow", "Angular", "Flutter", "BigQuery"],
    values: ["Innovation", "Collaboration", "Excellence", "User First"],
    culture: "Innovation-driven with emphasis on data and user experience",
  },
  "amazon": {
    name: "Amazon",
    industry: "E-commerce",
    techStack: ["AWS", "Java", "Python", "Microservices", "AI", "Docker", "React", "DynamoDB"],
    values: ["Customer First", "Innovation", "Excellence", "Frugality", "Ownership"],
    culture: "Customer-obsessed with high standards and fast-paced environment",
  },
  "apple": {
    name: "Apple",
    industry: "Technology",
    techStack: ["Swift", "Python", "Cloud", "Machine Learning", "React Native", "Objective-C"],
    values: ["Innovation", "Design Excellence", "Privacy", "Simplicity"],
    culture: "Design-focused with emphasis on innovation and user privacy",
  },
  "meta": {
    name: "Meta",
    industry: "Technology",
    techStack: ["React", "Python", "AI", "Hack", "GraphQL", "Cassandra", "Docker"],
    values: ["Innovation", "Connection", "Community", "Open Source"],
    culture: "Fast-moving, innovation-driven with focus on social connection",
  },
  "netflix": {
    name: "Netflix",
    industry: "Media & Entertainment",
    techStack: ["Java", "AWS", "Microservices", "Python", "React", "Kafka", "Spinnaker"],
    values: ["Innovation", "Freedom", "Responsibility", "Excellence"],
    culture: "Freedom and responsibility with high performance standards",
  },
  "stripe": {
    name: "Stripe",
    industry: "Finance",
    techStack: ["Ruby", "API", "AWS", "React", "Docker", "PostgreSQL", "GraphQL"],
    values: ["Developer First", "Transparency", "Innovation", "Global Impact"],
    culture: "Developer-focused with emphasis on economic infrastructure",
  },
  "uber": {
    name: "Uber",
    industry: "Transportation",
    techStack: ["Go", "Python", "Microservices", "React", "Kafka", "Docker", "AWS"],
    values: ["Innovation", "Reliability", "Safety", "Inclusion"],
    culture: "Fast-paced with focus on reliability and global scale",
  },
  "airbnb": {
    name: "Airbnb",
    industry: "Technology",
    techStack: ["React", "Ruby", "AWS", "Kubernetes", "TypeScript", "GraphQL"],
    values: ["Belonging", "Innovation", "Trust", "Hosting"],
    culture: "Community-driven with focus on belonging and trust",
  },
  "spotify": {
    name: "Spotify",
    industry: "Media & Entertainment",
    techStack: ["Python", "Java", "GCP", "React", "Docker", "Kubernetes", "Kafka"],
    values: ["Innovation", "Collaboration", "Passion", "Playfulness"],
    culture: "Agile, squad-based with focus on creativity and innovation",
  },
  "linkedin": {
    name: "LinkedIn",
    industry: "Technology",
    techStack: ["Java", "Kafka", "Azure", "React", "GraphQL", "Play Framework"],
    values: ["Innovation", "Professional Growth", "Collaboration", "Integrity"],
    culture: "Professional development focused with collaborative environment",
  },
  "twitter": {
    name: "X (Twitter)",
    industry: "Media & Entertainment",
    techStack: ["Scala", "Python", "AWS", "React", "Kafka", "MySQL"],
    values: ["Innovation", "Free Expression", "Transparency"],
    culture: "Fast-paced with focus on real-time communication",
  },
  "shopify": {
    name: "Shopify",
    industry: "E-commerce",
    techStack: ["Ruby", "React", "GraphQL", "Docker", "Kubernetes", "AWS", "TypeScript"],
    values: ["Innovation", "Entrepreneurship", "Merchant First", "Impact"],
    culture: "Entrepreneurial with focus on empowering businesses",
  },
  "adobe": {
    name: "Adobe",
    industry: "Technology",
    techStack: ["Python", "React", "AWS", "Kubernetes", "TypeScript", "AI"],
    values: ["Creativity", "Innovation", "Inclusion", "Customer Focus"],
    culture: "Creative and innovative with focus on digital experiences",
  },
};

class ScraperService {
  async researchCompany(url) {
    console.log(`🔍 Researching: ${url}`);
    
    // Check known companies first
    const domain = this.extractDomain(url);
    if (KNOWN_COMPANIES[domain]) {
      console.log(`✅ Known company: ${KNOWN_COMPANIES[domain].name}`);
      return KNOWN_COMPANIES[domain];
    }
    
    // Try to scrape the website
    try {
      const html = await this.fetchUrl(url);
      const data = this.parseHTML(html, url);
      console.log(`✅ Scraped: ${data.name} | ${data.industry} | ${data.techStack.length} tech`);
      return data;
    } catch (error) {
      console.log(`⚠️ Scrape failed: ${error.message}`);
      return this.getDefaultInfo(url);
    }
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname.replace("www.", "").split(".")[0].toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  fetchUrl(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith("https") ? https : http;
      const req = client.get(url, { 
        timeout: 8000,
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html,application/xhtml+xml"
        }
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return this.fetchUrl(res.headers.location).then(resolve).catch(reject);
        }
        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => resolve(data));
      });
      req.on("error", reject);
      req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    });
  }

  parseHTML(html, url) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

    return {
      name: this.extractName(title, html, url),
      description: this.extractDescription(html),
      industry: this.detectIndustry(text, title, url),
      techStack: this.detectTechStack(text),
      values: this.extractValues(text),
      culture: this.extractCulture(text),
      products: [],
    };
  }

  extractName(title, html, url) {
    const ogMatch = html.match(/<meta[^>]*property="og:site_name"[^>]*content="([^"]*)"[^>]*>/i);
    if (ogMatch) return ogMatch[1];
    if (title) return title.split(/[|\-–—]/)[0].trim();
    try { return new URL(url).hostname.replace("www.", "").split(".")[0]; }
    catch { return "Company"; }
  }

  extractDescription(html) {
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i) ||
                      html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i);
    return descMatch?.[1] || "";
  }

  detectIndustry(text, title, url) {
    const combined = (title + " " + text).toLowerCase();
    const domain = this.extractDomain(url);
    
    // Check domain-specific keywords first
    if (domain.includes("health") || domain.includes("med") || domain.includes("pharma")) {
      return "Healthcare";
    }
    if (domain.includes("bank") || domain.includes("fin") || domain.includes("pay") || domain.includes("invest")) {
      return "Finance";
    }
    if (domain.includes("edu") || domain.includes("learn") || domain.includes("school") || domain.includes("course")) {
      return "Education";
    }
    
    // Score-based industry detection
    const industries = {
      "Technology": ["software", "cloud", "saas", "platform", "digital", "tech", "developer", "api", "code", "devops", "programming", "open source", "repository", "ai", "machine learning"],
      "Healthcare": ["healthcare", "medical", "hospital", "patient", "clinical", "pharma", "health", "doctor", "nurse", "wellness"],
      "Finance": ["finance", "banking", "investment", "insurance", "fintech", "payment", "trading", "crypto", "wealth"],
      "Education": ["education", "learning", "teaching", "student", "course", "university", "school", "academic"],
      "E-commerce": ["ecommerce", "retail", "shop", "marketplace", "shopping", "store", "merchant"],
      "Manufacturing": ["manufacturing", "factory", "production", "industrial", "assembly"],
      "Consulting": ["consulting", "advisory", "strategy", "solutions", "services"],
      "Media & Entertainment": ["media", "entertainment", "streaming", "content", "publishing", "social media", "video", "music"],
      "Transportation": ["transport", "logistics", "delivery", "shipping", "freight", "mobility", "ride"],
    };

    let bestMatch = "Technology";
    let bestScore = 0;

    for (const [industry, keywords] of Object.entries(industries)) {
      const score = keywords.filter(k => combined.includes(k)).length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = industry;
      }
    }

    return bestMatch;
  }

  detectTechStack(text) {
    const techs = [
      "React", "Angular", "Vue", "Next.js", "Node.js", "Python", "Java", "Go", "Rust", "Ruby",
      "AWS", "Azure", "GCP", "Docker", "Kubernetes", "MongoDB", "PostgreSQL", "MySQL", "Redis",
      "GraphQL", "TypeScript", "JavaScript", "Machine Learning", "AI", "TensorFlow", "PyTorch",
      "React Native", "Flutter", "Swift", "Kotlin", "DevOps", "CI/CD", "Terraform", "Microservices",
      "Kafka", "Spark", "Hadoop", "Elasticsearch", "Firebase", "DynamoDB", "Cassandra",
      "Git", "GitHub", "GitLab", "Jenkins", "REST API", "GraphQL", "gRPC",
    ];
    const found = techs.filter(t => text.includes(t.toLowerCase()));
    return found.length >= 3 ? found.slice(0, 12) : ["JavaScript", "Python", "Cloud", "Agile", "CI/CD", "Docker"];
  }

  extractValues(text) {
    const values = [
      "Innovation", "Integrity", "Collaboration", "Excellence", "Diversity", "Inclusion",
      "Sustainability", "Transparency", "Accountability", "Teamwork", "Growth", "Quality",
      "Trust", "Customer First", "Developer First", "Open Source", "Privacy", "Security",
      "Empowerment", "Creativity", "Leadership", "Ownership", "Simplicity", "Boldness",
    ];
    const found = values.filter(v => text.includes(v.toLowerCase()));
    return found.length > 0 ? found : ["Innovation", "Excellence", "Collaboration", "Integrity"];
  }

  extractCulture(text) {
    return "Professional and collaborative environment focused on innovation and growth";
  }

  getDefaultInfo(url) {
    const domain = this.extractDomain(url);
    const name = domain.charAt(0).toUpperCase() + domain.slice(1);
    
    return {
      name,
      description: "",
      industry: "Technology",
      techStack: ["JavaScript", "Python", "Cloud", "Agile", "CI/CD", "Docker", "Git"],
      values: ["Innovation", "Excellence", "Collaboration"],
      culture: "Professional environment focused on innovation and growth",
      products: [],
    };
  }
}

module.exports = new ScraperService();