-- Track-My-Tax  –  MySQL Setup Script
-- Run as a MySQL root / admin user:
--   mysql -u root -p < setup_db.sql

-- ── Database & user ─────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS escrow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'escrow_user'@'localhost' IDENTIFIED BY '1k2a3p';
GRANT ALL PRIVILEGES ON escrow.* TO 'escrow_user'@'localhost';
FLUSH PRIVILEGES;

USE escrow;

-- ── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  email            VARCHAR(255) NOT NULL UNIQUE,
  name             VARCHAR(255) NOT NULL,
  password_hash    VARCHAR(255) NOT NULL,
  role             ENUM('Admin','Faculty','Student') NOT NULL DEFAULT 'Student',
  wallet_address   VARCHAR(42) NOT NULL,
  credits          BIGINT NOT NULL DEFAULT 0,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS projects (
  project_id       VARCHAR(20)  PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  location         VARCHAR(255),
  lat              DECIMAL(10,6),
  lng              DECIMAL(10,6),
  expected_label   VARCHAR(100),
  budget           DECIMAL(18,2) NOT NULL DEFAULT 0,
  escrow           DECIMAL(18,2) NOT NULL DEFAULT 0,
  progress         INT NOT NULL DEFAULT 0,
  risk_level       ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW',
  status           ENUM('OPTIMAL','MONITORING','AT_RISK','FROZEN','LOCKED') NOT NULL DEFAULT 'OPTIMAL',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transactions (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  wallet_address   VARCHAR(42)  NOT NULL,
  project_id       VARCHAR(20)  REFERENCES projects(project_id),
  amount           DECIMAL(18,2) NOT NULL,
  type             ENUM('MINT','ALLOCATE','LOCK','RELEASE','FREEZE') NOT NULL,
  timestamp        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS predictions (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  project_id       VARCHAR(20),
  risk_level       ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW',
  confidence       FLOAT NOT NULL DEFAULT 0,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS verifications (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  project_id       VARCHAR(20),
  gps_status       ENUM('PASSED','FAILED') NOT NULL DEFAULT 'PASSED',
  timestamp_status ENUM('PASSED','FAILED') NOT NULL DEFAULT 'PASSED',
  mobilenet_status VARCHAR(100),
  confidence       FLOAT NOT NULL DEFAULT 0,
  result           ENUM('VERIFIED','UNDER_REVIEW','REJECTED') NOT NULL DEFAULT 'UNDER_REVIEW',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Seed data ────────────────────────────────────────────────────────────────
-- Admin user  (password: admin123)
INSERT IGNORE INTO users (email, name, password_hash, role, wallet_address, credits)
VALUES (
  'admin@tax.local',
  'Admin User',
  '$2b$12$placeholder_hash_replace_with_real',
  'Admin',
  '0xA1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1',
  1000000
);

INSERT IGNORE INTO projects
  (project_id, title, description, location, lat, lng, expected_label, budget, escrow, progress, risk_level, status)
VALUES
  ('SOL-001', 'Solar Panel Installation',
   'Installation of solar panels at Electrical Engineering Department, UET Peshawar',
   'EE Dept, UET Peshawar', 34.008000, 71.428000, 'solar_cell',
   5000, 2500, 60, 'LOW', 'OPTIMAL'),

  ('FAN-001', 'Ceiling Fan Distribution',
   'Distribution and installation of energy-efficient ceiling fans in New Academic Block, UET',
   'New Academic Block, UET Peshawar', 34.001700, 71.485400, 'electric_fan',
   3000, 1500, 45, 'MEDIUM', 'OPTIMAL'),

  ('LAB-001', 'Lab Equipment Setup',
   'Setup of a 50-workstation computer lab for engineering students in New Academic Block, UET',
   'New Academic Block, UET Peshawar', 34.001700, 71.485400, 'desktop_computer',
   8000, 4000, 30, 'HIGH', 'LOCKED'),

  ('NET-001', 'Network Infrastructure',
   'Fiber-optic network deployment across all departments at UET Peshawar',
   'New Academic Block, UET Peshawar', 34.001700, 71.485400, 'modem',
   12000, 6000, 75, 'LOW', 'OPTIMAL');
