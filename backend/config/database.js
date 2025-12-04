const mysql = require('mysql2/promise');
require('dotenv').config();

class Database {
  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'amazon_optimizer',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: '+00:00',
      charset: 'utf8mb4'
    };
    
    this.pool = mysql.createPool(this.config);
  }

  async connect() {
    try {
      const connection = await this.pool.getConnection();
      console.log('✅ Database connected successfully!');
      console.log(`   Host: ${this.config.host}`);
      console.log(`   Database: ${this.config.database}`);
      connection.release();
      return true;
    } catch (error) {
      console.error('❌ Database connection failed!');
      console.error('Error details:', error.message);
      throw error;
    }
  }

  async query(sql, params) {
    try {
      const [results] = await this.pool.execute(sql, params);
      return results;
    } catch (error) {
      console.error('Database query error:', error.message);
      throw error;
    }
  }

  async initialize() {
    try {
      const connection = await this.pool.getConnection();
      try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${this.config.database}`);
      } finally {
        connection.release();
      }
      
      // Note: No need for USE statement - database is specified in pool config
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS optimizations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          asin VARCHAR(20) NOT NULL,
          original_title TEXT,
          optimized_title TEXT,
          original_bullets JSON,
          optimized_bullets JSON,
          original_description TEXT,
          optimized_description TEXT,
          keywords JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_asin (asin),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;
      
      await this.query(createTableQuery);
      console.log('✅ Database table initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const [result] = await this.pool.execute('SELECT 1 + 1 AS result');
      console.log('Database test query result:', result[0].result);
      return true;
    } catch (error) {
      console.error('Database test failed:', error.message);
      return false;
    }
  }
}

module.exports = new Database();