const express = require('express');
const router = express.Router();
const dbService = require('../services/db-service');

router.get('/:asin', async (req, res) => {
  try {
    const { asin } = req.params;
    
    if (!asin) {
      return res.status(400).json({
        success: false,
        message: 'ASIN parameter is required'
      });
    }

    const history = await dbService.getOptimizationHistory(asin);
    
    res.json({
      success: true,
      data: {
        asin,
        totalOptimizations: history.length,
        optimizations: history
      }
    });

  } catch (error) {
    console.error('History retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve optimization history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const allHistory = await dbService.getAllOptimizations();
    
    res.json({
      success: true,
      data: {
        totalOptimizations: allHistory.length,
        optimizations: allHistory
      }
    });

  } catch (error) {
    console.error('All history retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve optimization history'
    });
  }
});

module.exports = router;