const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class AIService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('AI API key not found. Using mock AI responses.');
      this.useMock = true;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);

      // Use a stable, free model
      const FREE_MODEL = "gemini-2.0-flash";

      this.model = this.genAI.getGenerativeModel({
        model: FREE_MODEL,
      });

      console.log(`Selected AI model: ${FREE_MODEL}`);
      this.useMock = false;

    } catch (error) {
      console.error('AI initialization error:', error);
      this.useMock = true;
    }
  }

  // Generate optimized product listing
  async optimizeProductListing(productDetails) {
    if (this.useMock) {
      return this.generateMockOptimization(productDetails);
    }

    try {
      const prompt = this.createOptimizationPrompt(productDetails);

      // If no model was picked at startup, attempt to select a non-pro model now
      if (!this.model && this.genAI) {
        const candidateModels = [
          'text-bison-001',
          'chat-bison-001',
          'gemini-1.5-mini',
          'gemini-1.0',
        ];
        for (const m of candidateModels) {
          try {
            this.model = this.genAI.getGenerativeModel({ model: m });
            console.log(`Dynamically selected AI model: ${m}`);
            break;
          } catch (err) {
          }
        }
      }

      if (this.model) {
        const result = await this.model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        });
        const text = result.response.text();
        return this.parseAIResponse(text);
      } else {
        console.warn('No compatible AI model available; falling back to mock optimization');
        return this.generateMockOptimization(productDetails);
      }
    } catch (error) {
      console.error('AI optimization error:', error);
      console.log('Falling back to mock optimization');
      return this.generateMockOptimization(productDetails);
    }
  }

  createOptimizationPrompt(productDetails) {
    // Stronger, more prescriptive prompt with schema, length constraints and an example.
    return `You are an expert Amazon SEO specialist and senior copywriter.

  INSTRUCTIONS
  - Read the ORIGINAL PRODUCT DETAILS and produce an optimized listing that is keyword-aware, persuasive, and compliant with Amazon policy.
  - Output MUST be a single JSON object, and nothing else. Do not add commentary or extraneous text.
  - If a field cannot be created, return an empty string (for strings) or an empty array (for lists).

  RESPONSE SCHEMA (exact keys)
  {
    "optimizedTitle": string,                
    "optimizedBulletPoints": [string],       
    "optimizedDescription": string,          
    "keywords": [string]                     
  }

  CONSTRAINTS & TONE
  - Title: include main product type and 1-2 high-value keywords naturally; avoid ALL CAPS; keep under 150 chars.
  - Bullets: produce 3–5 bullets. Start with the strongest benefit, include measurable claims only if present in the original, use active voice, avoid medical/illegal claims.
  - Description: 2–4 short paragraphs (approx. 40–120 words total). Use persuasive, scannable copy (short sentences, clear CTAs). Do not invent claims not present in original.
  - Keywords: suggest 3–5 relevant search phrases (no commas inside phrases). Lowercase, no punctuation.

  ORIGINAL PRODUCT DETAILS:
  Title: ${productDetails.title || ''}

  Bullet Points:
  ${(productDetails.bulletPoints || []).map((bp, i) => `${i + 1}. ${bp}`).join('\n')}

  Description:
  ${productDetails.description || ''}

  EXAMPLE OUTPUT (must follow schema exactly):
  {
    "optimizedTitle": "Acme Stainless Steel Coffee Grinder — Electric Burr Grinder, 12-Cup Capacity, Quiet Motor",
    "optimizedBulletPoints": [
    "Precision burrs deliver uniform grind size for better flavor",
    "Quiet motor reduces noise during operation",
    "12-cup capacity ideal for households and small offices",
    "Durable stainless steel body with easy-clean components",
    "Includes removable catch cup and anti-slip base"
    ],
    "optimizedDescription": "Upgrade your morning routine with the Acme Stainless Steel Coffee Grinder. Its precision burrs produce consistent grounds for fuller flavor and better extraction.\n\nDesigned for quiet operation and built to last, this grinder features a 12-cup capacity and easy-to-clean parts. Perfect for home or office use — enjoy barista-quality coffee every day.",
    "keywords": ["stainless steel coffee grinder", "electric burr grinder", "quiet coffee grinder"]
  }

  Now produce the JSON response for the ORIGINAL PRODUCT DETAILS above, and return only the JSON object (no surrounding text).`;
  }

  parseAIResponse(responseText) {
   

    const tryParse = (text) => {
      try {
        return JSON.parse(text);
      } catch (e) {
        return null;
      }
    };

    let parsed = tryParse(responseText);
    if (parsed) return parsed;

    const jsonMatch = String(responseText).match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = tryParse(jsonMatch[0]);
      if (parsed) return parsed;

      let candidate = jsonMatch[0].replace(/,\s*([}\]])/g, '$1');
      candidate = candidate.replace(/'([^']*)'/g, '"$1"');
      parsed = tryParse(candidate);
      if (parsed) return parsed;
    }

    const lines = String(responseText).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const obj = {};
    let foundAny = false;
    for (const line of lines) {
      const kvMatch = line.match(/^\s*"?([a-zA-Z0-9_\- ]+)"?\s*:\s*(.*)$/);
      if (kvMatch) {
        foundAny = true;
        const key = kvMatch[1].trim();
        let value = kvMatch[2].trim();
        if (value.startsWith('[') || value.startsWith('{')) {
          const p = tryParse(value);
          if (p !== null) {
            obj[key] = p;
            continue;
          }
        }
        value = value.replace(/^['"]|['"]$/g, '');
        if (value.includes(',')) {
          obj[key] = value.split(/\s*,\s*/).map(s => s.trim()).filter(Boolean);
        } else {
          obj[key] = value;
        }
      }
    }
    if (foundAny) return obj;

    console.error('Unable to parse AI response into JSON. Raw response below:');
    try { console.error(String(responseText).substring(0, 5000)); } catch (e) { /* ignore */ }
    throw new Error('AI response parsing failed');
  }

  generateMockOptimization(productDetails) {
    console.log('Using mock AI optimization');

    const baseTitle = productDetails.title || 'Original Product';
    const mockKeywords = [
      'best selling product',
      'premium quality',
      'amazon choice',
      `${baseTitle.split(' ')[0]} enhanced`,
      'customer favorite'
    ];

    return {
      optimizedTitle: `[OPTIMIZED] ${baseTitle.substring(0, 150)} - Premium Quality & Best Value`,
      optimizedBulletPoints: [
        '✅ PROFESSIONAL GRADE: Enhanced performance for superior results',
        '✅ PREMIUM QUALITY: Made with high-grade materials for durability',
        '✅ EASY TO USE: User-friendly design for all skill levels',
        '✅ GREAT VALUE: Competitive pricing with premium features',
        '✅ SATISFACTION GUARANTEE: Risk-free purchase with excellent support'
      ],
      optimizedDescription: `Discover the ultimate ${baseTitle.split(' ')[0]} experience with our premium optimized version. 

Why choose our product?
• Enhanced performance for better results
• Premium materials for long-lasting durability
• User-friendly design suitable for everyone
• Exceptional value that outperforms competitors

Experience the difference today with our risk-free satisfaction guarantee. Perfect for both beginners and professionals seeking reliable quality. 

ORDER NOW and transform your experience!`,
      keywords: mockKeywords.slice(0, 4)
    };
  }
}

module.exports = new AIService();