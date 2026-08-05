-- ============================================================
-- Workshop Maintenance System - MySQL Database Schema (v2.0 Fixed)
-- ============================================================

CREATE DATABASE IF NOT EXISTS workshop_maintenance;
USE workshop_maintenance;

-- ────────────────────────────────────────────────────────────
-- Machines table
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
-- Machine parameters table
--
-- PARAMETER ANALYSIS NOTES:
--   temperature       : REQUIRED  (25%) — High temp → bearing/motor wear. Arrhenius law.
--   vibration         : REQUIRED  (35%) — Best single mechanical failure predictor (ISO 10816).
--   power_usage       : REQUIRED  (20%) — Power spikes/drops → load anomalies / motor degradation.
--   operational_hours : REQUIRED  (20%) — Time-based wear; aligns with OEM service intervals.
--   tool_condition    : EXCEPTION       — Only relevant for CNC/cutting machines.
--                                         NULL for general machines (pumps, motors, compressors).
--                                         When present: applies ±15% adjustment on risk score.
--                                         When NULL:    excluded entirely — no impact on prediction.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS machine_parameters (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  machine_id        INT NOT NULL,
  temperature       DECIMAL(6,2)  NOT NULL    COMMENT 'Degrees Celsius — Required 25%: motor/bearing health',
  vibration         DECIMAL(6,3)  NOT NULL    COMMENT 'mm/s — Required 35%: best single failure predictor',
  power_usage       DECIMAL(7,2)  NOT NULL    COMMENT 'kW — Required 20%: load anomaly / motor degradation',
  operational_hours INT           NOT NULL    COMMENT 'Hours — Required 20%: time-based wear scheduling',
  tool_condition    DECIMAL(5,2)  DEFAULT NULL COMMENT '% 0-100 — EXCEPTION: CNC/cutting only. NULL = excluded from scoring.',
  recorded_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────────────────
-- Predictions table  (stores AI engine output per run)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS predictions (
  id                       INT AUTO_INCREMENT PRIMARY KEY,
  machine_id               INT NOT NULL,
  risk_score               DECIMAL(5,2)  NOT NULL COMMENT '0-100',
  status                   ENUM('Healthy','Moderate','Critical') NOT NULL DEFAULT 'Healthy',
  confidence               DECIMAL(5,2)  NOT NULL COMMENT '0-100',
  days_until_maintenance   INT           NOT NULL,
  recommended_action       TEXT,
  priority                 ENUM('Low','Medium','High') NOT NULL DEFAULT 'Low',
  predicted_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────────────────
-- Maintenance schedule table
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_schedule (
  id                       INT AUTO_INCREMENT PRIMARY KEY,
  machine_id               INT NOT NULL,
  scheduled_date           DATE,
  estimated_duration_hours DECIMAL(4,1) DEFAULT 2.0,
  task_description         TEXT,
  priority                 ENUM('Low','Medium','High') NOT NULL DEFAULT 'Low',
  status                   ENUM('Pending','In Progress','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
  created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────────────────
-- Performance indexes
-- ────────────────────────────────────────────────────────────
CREATE INDEX idx_machine_params_machine_id  ON machine_parameters(machine_id);
CREATE INDEX idx_predictions_machine_id     ON predictions(machine_id);
CREATE INDEX idx_predictions_predicted_at   ON predictions(predicted_at);
CREATE INDEX idx_schedule_machine_id        ON maintenance_schedule(machine_id);
CREATE INDEX idx_schedule_status            ON maintenance_schedule(status);
CREATE INDEX idx_schedule_priority          ON maintenance_schedule(priority);

-- ────────────────────────────────────────────────────────────
-- Seed data
-- ────────────────────────────────────────────────────────────
INSERT INTO machines (name, machine_type, location) VALUES
  ('Lathe Machine #1',    'CNC Lathe',  'Bay A'),
  ('Milling Machine #2',  'CNC Mill',   'Bay B'),
  ('Air Compressor #1',   'Compressor', 'Utility Room'),
  ('Hydraulic Press #3',  'Press',      'Bay C');

-- CNC machines get tool_condition; general machines get NULL
INSERT INTO machine_parameters
  (machine_id, temperature, vibration, power_usage, operational_hours, tool_condition)
VALUES
  (1,  45.5, 1.2,  7.8, 2340,  85.0),   -- CNC Lathe    → tool_condition present
  (2,  72.3, 3.8, 12.4, 5600,  42.0),   -- CNC Mill     → tool_condition present (worn)
  (3,  58.1, 2.1,  9.2, 3800,  NULL),   -- Compressor   → NULL (not applicable)
  (4,  38.0, 0.8,  5.5, 1200,  NULL);   -- Hydraulic    → NULL (not applicable)
