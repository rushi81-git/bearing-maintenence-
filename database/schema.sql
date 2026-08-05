-- AI-Driven Smart Workshop Maintenance System
-- MySQL Database Schema

CREATE DATABASE IF NOT EXISTS workshop_maintenance;
USE workshop_maintenance;

-- Machines Table
CREATE TABLE IF NOT EXISTS machines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(100) DEFAULT 'General Equipment',
    location VARCHAR(100) DEFAULT 'Workshop Floor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Machine Parameters Table
-- NOTE: 'operational_hours' is marked as EXCEPTION — it is a record-keeping field,
-- not a real-time sensor value. It can influence long-term wear estimates but does NOT
-- directly feed into the Random Forest risk prediction model because:
--   1. It is manually entered and may be inaccurate.
--   2. Its effect on failure is already captured indirectly through temperature/vibration trends.
--   3. Including it causes feature collinearity with tool_condition (both track wear over time).
-- It is stored for auditing/reporting but excluded from ML feature vector.

CREATE TABLE IF NOT EXISTS machine_parameters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    machine_id INT NOT NULL,
    temperature DECIMAL(6,2) NOT NULL COMMENT 'Unit: Celsius | Range: 20-120 | Used in prediction: YES',
    vibration DECIMAL(6,3) NOT NULL COMMENT 'Unit: mm/s | Range: 0-20 | Used in prediction: YES',
    power_usage DECIMAL(8,2) NOT NULL COMMENT 'Unit: kW | Range: 0-100 | Used in prediction: YES',
    tool_condition DECIMAL(5,2) NOT NULL COMMENT 'Unit: % | Range: 0-100 | Used in prediction: YES',
    operational_hours DECIMAL(10,2) DEFAULT 0 COMMENT 'Unit: hours | EXCEPTION: NOT used in ML prediction — stored for records only. See schema notes above.',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

-- Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    machine_id INT NOT NULL,
    risk_score DECIMAL(5,2) NOT NULL COMMENT 'Range: 0-100',
    status ENUM('Healthy', 'Moderate', 'Critical') NOT NULL,
    confidence DECIMAL(5,2) NOT NULL COMMENT 'Range: 0-100',
    days_until_maintenance INT,
    recommended_action TEXT,
    priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
    predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

-- Maintenance Schedule Table
CREATE TABLE IF NOT EXISTS maintenance_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    machine_id INT NOT NULL,
    scheduled_date DATE NOT NULL,
    estimated_duration_hours DECIMAL(4,1),
    task_description TEXT,
    status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
    priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_machine_params_machine_id ON machine_parameters(machine_id);
CREATE INDEX idx_predictions_machine_id ON predictions(machine_id);
CREATE INDEX idx_schedule_machine_id ON maintenance_schedule(machine_id);
CREATE INDEX idx_schedule_date ON maintenance_schedule(scheduled_date);

-- Sample seed data
INSERT INTO machines (name, type, location) VALUES
('CNC Lathe Machine #1', 'CNC Machine', 'Bay A'),
('Milling Machine #2', 'Milling', 'Bay B'),
('Hydraulic Press #3', 'Press', 'Bay C');

INSERT INTO machine_parameters (machine_id, temperature, vibration, power_usage, tool_condition, operational_hours)
VALUES
(1, 75.5, 3.2, 45.0, 72.0, 1200),
(2, 85.0, 5.8, 60.5, 45.0, 2500),
(3, 65.0, 2.1, 30.0, 90.0, 800);
