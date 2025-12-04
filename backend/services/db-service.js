const database = require('../config/database');

class DBService {
  async saveOptimization(data) {
    const {
      asin,
      title: original_title,
      bulletPoints: original_bullets,
      description: original_description,
      optimizedTitle,
      optimizedBulletPoints,
      optimizedDescription,
      keywords
    } = data;

    const query = `
      INSERT INTO optimizations (
        asin, 
        original_title, 
        original_bullets, 
        original_description,
        optimized_title, 
        optimized_bullets, 
        optimized_description, 
        keywords
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      asin,
      original_title,
      JSON.stringify(original_bullets || []),
      original_description,
      optimizedTitle,
      JSON.stringify(optimizedBulletPoints || []),
      optimizedDescription,
      JSON.stringify(keywords || [])
    ];

    try {
      const result = await database.query(query, params);
      
      const savedRecord = await this.getOptimizationById(result.insertId);
      return savedRecord;
    } catch (error) {
      console.error('Save optimization error:', error);
      throw new Error('Database: Failed to save optimization');
    }
  }

  async getOptimizationById(id) {
    const query = `SELECT * FROM optimizations WHERE id = ?`;
    const results = await database.query(query, [id]);
    return results[0] || null;
  }

  async getOptimizationHistory(asin) {
    const query = `
      SELECT 
        id,
        asin,
        original_title,
        optimized_title,
        original_bullets,
        optimized_bullets,
        original_description,
        optimized_description,
        keywords,
        created_at
      FROM optimizations 
      WHERE asin = ? 
      ORDER BY created_at DESC
    `;

    try {
      const results = await database.query(query, [asin]);
      
      // Parse JSON fields
      return results.map(record => ({
        ...record,
        original_bullets: record.original_bullets ? JSON.parse(record.original_bullets) : [],
        optimized_bullets: record.optimized_bullets ? JSON.parse(record.optimized_bullets) : [],
        keywords: record.keywords ? JSON.parse(record.keywords) : []
      }));
    } catch (error) {
      console.error('Get history error:', error);
      throw new Error('Database: Failed to retrieve optimization history');
    }
  }

  async getAllOptimizations() {
    const query = `
      SELECT 
        asin,
        optimized_title,
        keywords,
        created_at
      FROM optimizations 
      ORDER BY created_at DESC
      LIMIT 100
    `;

    try {
      const results = await database.query(query);
      
      return results.map(record => ({
        ...record,
        keywords: record.keywords ? JSON.parse(record.keywords) : []
      }));
    } catch (error) {
      console.error('Get all optimizations error:', error);
      throw new Error('Database: Failed to retrieve optimizations');
    }
  }

  async asinExists(asin) {
    const query = `SELECT COUNT(*) as count FROM optimizations WHERE asin = ?`;
    const results = await database.query(query, [asin]);
    return results[0].count > 0;
  }

  async getLatestOptimization(asin) {
    const query = `
      SELECT * FROM optimizations 
      WHERE asin = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const results = await database.query(query, [asin]);
    return results[0] || null;
  }
}

module.exports = new DBService();