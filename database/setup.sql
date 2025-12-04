-- Create database
CREATE DATABASE IF NOT EXISTS amazon_optimizer;
USE amazon_optimizer;

-- Create optimizations table
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
);

-- Create user (adjust credentials as needed)
CREATE USER IF NOT EXISTS 'optimizer_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON amazon_optimizer.* TO 'optimizer_user'@'localhost';
FLUSH PRIVILEGES;