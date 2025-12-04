const express = require('express');
const router = express.Router();
const scraper = require('../services/scraper');
const aiService = require('../services/ai-service');
const dbService = require('../services/db-service');


function isValidASIN(asin) {
  return asin && /^[A-Z0-9]{10}$/.test(asin);
}

router.post('/', async (req, res) => {
  try {
    const { asin } = req.body;
    
    if (!asin || !isValidASIN(asin)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-character ASIN (e.g., B08N5WRWNW)'
      });
    }

    // Scrape product details from Amazon
    console.log(`Scraping product with ASIN: ${asin}`);
    const productDetails = await scraper.scrapeAmazonProduct(asin);
    
    if (!productDetails || !productDetails.title) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unable to scrape details'
      });
    }

    // Optimize with AI
    console.log('Optimizing with AI...');
    const optimizedData = await aiService.optimizeProductListing(productDetails);
    
    // Save to database
    console.log('Saving to database...');
    const savedRecord = await dbService.saveOptimization({
      asin,
      ...productDetails,
      ...optimizedData
    });

    // Return both original and optimized data
    res.json({
      success: true,
      data: {
        asin,
        original: productDetails,
        optimized: optimizedData,
        timestamp: savedRecord.created_at
      }
    });

  } catch (error) {
    console.error('Optimization error:', error);
    
    let errorMessage = 'An error occurred during optimization';
    let statusCode = 500;
    
    if (error.message.includes('scraping')) {
      errorMessage = 'Failed to fetch product details from Amazon';
    } else if (error.message.includes('AI')) {
      errorMessage = 'Failed to generate optimized content';
    } else if (error.message.includes('database')) {
      errorMessage = 'Failed to save optimization';
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;