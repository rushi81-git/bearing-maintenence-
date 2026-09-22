-- ============================================================
-- Workshop Maintenance System — Database Schema (v3.0 CWRU AI Edition)
-- ============================================================

CREATE DATABASE IF NOT EXISTS workshop_maintenance;
USE workshop_maintenance;

-- ────────────────────────────────────────────────────────────
-- 1. Machines Table
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS machines (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  machine_type VARCHAR(100) DEFAULT 'General Equipment',
  location     VARCHAR(100) DEFAULT 'Workshop Floor',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ────────────────────────────────────────────────────────────
-- 2. General Machine Operational Parameters Table
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS machine_parameters (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  machine_id        INT NOT NULL,
  temperature       DECIMAL(6,2)  NOT NULL    COMMENT 'Degrees Celsius',
  vibration         DECIMAL(6,3)  NOT NULL    COMMENT 'mm/s RMS',
  power_usage       DECIMAL(7,2)  NOT NULL    COMMENT 'kW',
  operational_hours INT           NOT NULL    COMMENT 'Hours',
  tool_condition    DECIMAL(5,2)  DEFAULT NULL COMMENT '% 0-100 (CNC only)',
  recorded_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────────────────
-- 3. Maintenance Schedule Table
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_schedule (
  id                       INT AUTO_INCREMENT PRIMARY KEY,
  machine_id               INT NOT NULL,
  task_type                VARCHAR(100) DEFAULT 'General Maintenance',
  scheduled_date           DATE,
  due_date                 DATE,
  estimated_duration_hours DECIMAL(4,1) DEFAULT 2.0,
  task_description         TEXT,
  notes                    TEXT,
  priority                 ENUM('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
  status                   ENUM('pending','in_progress','completed','overdue','Pending','In Progress','Completed','Cancelled') NOT NULL DEFAULT 'pending',
  created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────────────────
-- 4. Bearing Diagnoses Table (CWRU AI Offline-Trained ML Output)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bearing_diagnoses (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  machine_id              INT NULL,
  bearing_status          VARCHAR(50) NOT NULL COMMENT 'Healthy or Fault Detected',
  predicted_class         VARCHAR(50) NOT NULL COMMENT 'Normal, Ball_007, IR_014, etc.',
  fault_type              VARCHAR(50) NOT NULL COMMENT 'Normal, Ball, Inner Race, Outer Race',
  fault_size_inches       DECIMAL(6,4) DEFAULT 0.0000,
  fault_size_mm           DECIMAL(6,4) DEFAULT 0.0000,
  severity                VARCHAR(50) NOT NULL COMMENT 'Healthy, Mild, Moderate, Severe',
  prediction_probability  DECIMAL(6,4) NOT NULL COMMENT 'Softmax probability 0.0000-1.0000',
  rms                     DECIMAL(10,5) NOT NULL,
  kurtosis                DECIMAL(10,5) NOT NULL,
  crest_factor            DECIMAL(10,5) NOT NULL,
  shape_factor            DECIMAL(10,5) NOT NULL,
  peak_to_peak            DECIMAL(10,5) NOT NULL,
  skewness                DECIMAL(10,5) NOT NULL,
  recommendation          TEXT,
  urgency                 VARCHAR(50),
  model_used              VARCHAR(100) NOT NULL,
  model_version           VARCHAR(100) NOT NULL,
  sampling_rate_hz        INT DEFAULT 48000,
  signal_unit             VARCHAR(20) DEFAULT 'g',
  source_type             VARCHAR(50) DEFAULT 'csv',
  windows_analyzed        INT DEFAULT 1,
  source_filename         VARCHAR(255) DEFAULT NULL,
  raw_features_json       TEXT,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE SET NULL
);

-- ────────────────────────────────────────────────────────────
-- Performance Indexes
-- ────────────────────────────────────────────────────────────
CREATE INDEX idx_machine_params_machine_id  ON machine_parameters(machine_id);
CREATE INDEX idx_schedule_machine_id        ON maintenance_schedule(machine_id);
CREATE INDEX idx_schedule_status            ON maintenance_schedule(status);
CREATE INDEX idx_bearing_diag_machine_id    ON bearing_diagnoses(machine_id);
CREATE INDEX idx_bearing_diag_severity      ON bearing_diagnoses(severity);
CREATE INDEX idx_bearing_diag_created_at    ON bearing_diagnoses(created_at);

-- ────────────────────────────────────────────────────────────
-- Seed Data
-- ────────────────────────────────────────────────────────────
INSERT INTO machines (name, machine_type, location) VALUES
  ('CNC Lathe Machine #1',    'CNC Lathe',   'Bay A'),
  ('Milling Center #2',       'CNC Mill',    'Bay B'),
  ('Air Compressor #1',       'Compressor',  'Utility Room'),
  ('Hydraulic Stamping #3',   'Press',       'Bay C')
ON DUPLICATE KEY UPDATE name=name;
