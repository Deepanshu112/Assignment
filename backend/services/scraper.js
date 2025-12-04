const axios = require('axios');
const cheerio = require('cheerio');

class AmazonScraper {
  constructor() {
    // Set headers to mimic a real browser
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    };
  }

  // Main scraping function
  async scrapeAmazonProduct(asin) {
    const url = `https://www.amazon.com/dp/${asin}`;

    console.log(`Attempting to scrape: ${url}`);

    try {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 10000, // 10 second timeout
      });

      if (response.status !== 200) {
        throw new Error(`Failed to fetch page. Status: ${response.status}`);
      }

      const $ = cheerio.load(response.data);

      // Extract product details
      const productDetails = {
        asin,
        title: this.extractTitle($),
        bulletPoints: this.extractBulletPoints($),
        description: this.extractDescription($)
      };

      // Validate we got at least a title
      if (!productDetails.title) {
        throw new Error('Product not found or page structure changed');
      }

      console.log(`Successfully scraped product: ${productDetails.title.substring(0, 50)}...`);
      return productDetails;

    } catch (error) {
      console.error('Scraping error:', error.message);
      console.error('Full error details:', error.response?.status || 'No response status');
      
      // Log the actual error for debugging
      if (error.response?.status === 503) {
        console.error('Amazon returned 503 - Service Unavailable. Amazon may be blocking requests.');
      } else if (error.response?.status === 403) {
        console.error('Amazon returned 403 - Forbidden. IP may be rate-limited.');
      } else if (error.code === 'ECONNABORTED') {
        console.error('Request timed out. Amazon may be slow or blocking.');
      }

      // Only use mock data if explicitly in development mode AND it's a timeout/network error
      if (process.env.NODE_ENV === 'development' && 
          (error.message.includes('timeout') || error.code === 'ECONNABORTED')) {
        console.warn('Network error detected. Using mock product data for development.');
        return this.generateMockProductData(asin);
      }

      // Otherwise, throw the error so we know real scraping failed
      throw new Error(`Scraping failed for ASIN ${asin}: ${error.message}`);
    }
  }

  // Extract product title
  extractTitle($) {
    let title = '';

    // Try different selectors (Amazon changes their HTML structure)
    const titleSelectors = [
      '#productTitle',
      '#title',
      'h1#title',
      'span#productTitle',
      '.product-title-word-break'
    ];

    for (const selector of titleSelectors) {
      title = $(selector).text().trim();
      if (title) break;
    }

    return title || 'Product title not found';
  }

  // Extract bullet points
  extractBulletPoints($) {
    const bulletPoints = [];

    // Try different selectors for bullet points
    const bulletSelectors = [
      '#feature-bullets ul li',
      '.a-unordered-list .a-list-item',
      '#important-information div:contains("About this item") + div ul li'
    ];

    for (const selector of bulletSelectors) {
      $(selector).each((i, elem) => {
        const text = $(elem).text().trim();
        if (text && text.length > 5 && bulletPoints.length < 10) {
          bulletPoints.push(text);
        }
      });
      if (bulletPoints.length > 0) break;
    }

    // If no bullets found, try to extract from feature section
    if (bulletPoints.length === 0) {
      $('[data-feature-name="feature"]').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text) bulletPoints.push(text);
      });
    }

    return bulletPoints.slice(0, 5); // Return max 5 bullet points
  }

  extractDescription($) {
    let description = '';

    // Priority: avoid A+ Content (which is mostly CSS/JS markup)
    // Target the actual product description sections
    const descriptionSelectors = [
      '#featurebullets-btf',           // "About this item" section (text-based)
      '[data-feature-name="featurebullets"]',
      '#aplus_feature_div',            // Some products use this for actual text
      '#productDescription',
      '#descriptionAndDetails',
    ];

    for (const selector of descriptionSelectors) {
      description = $(selector).text().trim();
      if (description && description.length > 50) break;
    }

    // Clean the description: remove CSS/JS code, extra whitespace
    description = this.cleanDescription(description);

    // If still no description, try product feature list as fallback
    if (!description || description.length < 50) {
      // Try to extract from "About this item" expandable section
      const aboutText = $('#feature-bullets').text().trim();
      if (aboutText && aboutText.length > 50) {
        description = aboutText;
      }
    }

    return description || 'Product description not available';
  }

  cleanDescription(text) {
    if (!text || typeof text !== 'string') return '';

    // Remove CSS blocks (anything between `{` and `}`)
    text = text.replace(/\{[^}]*\}/g, '');

    // Remove JavaScript code blocks and function calls
    text = text.replace(/function\s*\([^)]*\)\s*\{[^}]*\}/g, '');
    text = text.replace(/if\s*\([^)]*\)\s*\{[^}]*\}/g, '');
    text = text.replace(/P\.when\([^)]*\)\.execute\([^)]*\)/g, '');
    text = text.replace(/P\.register\([^)]*\)/g, '');
    text = text.replace(/\(function\s*\([^)]*\)[^}]*\}/g, '');

    // Remove HTML tags
    text = text.replace(/<[^>]*>/g, '');

    // Remove common code patterns
    text = text.replace(/\b(var|const|let|function|if|else|return|class|async|await)\b\s+/g, '');

    // Collapse multiple spaces/newlines
    text = text.replace(/\s+/g, ' ').trim();

    // Remove lines that look like code
    const lines = text.split('.');
    const cleanLines = lines.filter(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^\./) || trimmed.match(/[=!<>]+/) || trimmed.length < 3) {
        return false;
      }
      return true;
    });

    text = cleanLines.join('. ').trim();

    // Remove URLs
    text = text.replace(/https?:\/\/[^\s]+/g, '');
    text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+/g, '');

    return text;
  }

  // Extract product price
  extractPrice($) {
    let price = '';
    const priceSelectors = [
      '.a-price-whole',
      '.a-price.a-text-price.a-size-medium.a-color-price',
      '[data-a-color="price"]'
    ];
    
    for (const selector of priceSelectors) {
      price = $(selector).first().text().trim();
      if (price) break;
    }
    
    return price || 'Price not available';
  }

  // Extract product rating
  extractRating($) {
    let rating = '';
    const ratingSelectors = [
      '.a-icon-star span',
      '[data-a-icon-star-small-part] span',
      '.a-icon-star-small span'
    ];
    
    for (const selector of ratingSelectors) {
      rating = $(selector).first().text().trim();
      if (rating) break;
    }
    
    return rating || 'No rating available';
  }

  // Extract product image
  extractImage($) {
    let imageUrl = '';
    const imageSelectors = [
      '#landingImage',
      '.a-dynamic-image',
      '#altImages img'
    ];
    
    for (const selector of imageSelectors) {
      imageUrl = $(selector).attr('src');
      if (imageUrl) break;
    }
    
    return imageUrl || 'Image not available';
  }

  // Generate mock product data for development/testing
  generateMockProductData(asin) {
    console.log(`Generating mock data for ASIN: ${asin}`);

    return {
      asin,
      title: `Sample Product ${asin} - Premium Quality Item`,
      bulletPoints: [
        'High-quality materials for durability',
        'Easy to use with clear instructions',
        'Versatile for multiple applications',
        'Backed by manufacturer warranty',
        'Customer favorite with excellent reviews'
      ],
      description: `This is a detailed description of the product with ASIN ${asin}. 
      
It includes information about features, specifications, and benefits. 
The product is designed to meet customer needs with reliable performance. 

Key Features:
- Premium construction
- User-friendly design
- Multiple use cases
- Excellent value for money

Perfect for both beginners and professionals seeking quality and reliability.`,
      price: '$49.99',
      rating: '4.5 out of 5 stars',
      imageUrl: 'https://via.placeholder.com/300x300.png?text=Product+Image'
    };
  }
}

module.exports = new AmazonScraper();