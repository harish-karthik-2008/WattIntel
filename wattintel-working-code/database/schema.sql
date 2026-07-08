DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS recommendations;
DROP TABLE IF EXISTS readings;
DROP TABLE IF EXISTS machines;
DROP TABLE IF EXISTS profile;

CREATE TABLE profile (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_name VARCHAR(120) NOT NULL,
  industry_type VARCHAR(100) NOT NULL,
  location VARCHAR(120),
  monthly_bill DECIMAL(10,2) DEFAULT 0,
  tariff_per_unit DECIMAL(10,2) DEFAULT 8,
  working_hours INT DEFAULT 8
);

CREATE TABLE machines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  type VARCHAR(100),
  rated_kw DECIMAL(10,2) NOT NULL,
  threshold_kw DECIMAL(10,2) DEFAULT 0,
  status ENUM('running','idle','off') DEFAULT 'off'
);

CREATE TABLE readings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  machine_id INT NOT NULL,
  voltage DECIMAL(10,2),
  current_amp DECIMAL(10,2),
  power_kw DECIMAL(10,2),
  energy_kwh DECIMAL(10,3),
  power_factor DECIMAL(10,2),
  status ENUM('running','idle','off'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

CREATE TABLE alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  machine_id INT NOT NULL,
  type VARCHAR(80),
  severity ENUM('low','medium','high') DEFAULT 'medium',
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

CREATE TABLE recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150),
  description TEXT,
  saving_rupees DECIMAL(10,2) DEFAULT 0
);
