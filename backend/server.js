const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const pool = require('./db');
const PYTHON_ML_URL = process.env.PYTHON_ML_URL || 'http://127.0.0.1:8000';

// ──────────────────────────────────────────────────────────────────────────────
// In-Memory Seed Fallback (Ensures full operation even if MySQL is offline)
// ──────────────────────────────────────────────────────────────────────────────
let inMemoryMachines = [
  { id: 1, name: 'CNC Lathe Machine #1', machine_type: 'CNC Lathe', type: 'CNC Lathe', location: 'Bay A', temperature: 45.5, vibration: 1.2, power_usage: 7.8, operational_hours: 2340, tool_condition: 85.0, created_at: new Date('2026-08-01').toISOString() },
  { id: 2, name: 'Milling Center #2', machine_type: 'CNC Mill', type: 'CNC Mill', location: 'Bay B', temperature: 72.3, vibration: 3.8, power_usage: 12.4, operational_hours: 5600, tool_condition: 42.0, created_at: new Date('2026-08-05').toISOString() },
  { id: 3, name: 'Air Compressor #1', machine_type: 'Compressor', type: 'Compressor', location: 'Utility Room', temperature: 58.1, vibration: 2.1, power_usage: 9.2, operational_hours: 3800, tool_condition: null, created_at: new Date('2026-08-10').toISOString() },
  { id: 4, name: 'Hydraulic Stamping #3', machine_type: 'Press', type: 'Press', location: 'Bay C', temperature: 38.0, vibration: 0.8, power_usage: 5.5, operational_hours: 1200, tool_condition: null, created_at: new Date('2026-08-15').toISOString() },
];

let inMemorySchedule = [
  { id: 1, machine_id: 2, machine_name: 'Milling Center #2', machine_type: 'CNC Mill', scheduled_date: '2026-08-25', estimated_duration_hours: 2.0, task_description: 'Inspect lubrication, spindle alignment, and bearing wear.', priority: 'Medium', status: 'Pending' }
];

let inMemoryBearingHistory = [
  {
    id: 1,
    machine_id: 2,
    machine_name: 'Milling Center #2',
    bearing_status: 'Fault Detected',
    predicted_class: 'IR_014',
    fault_type: 'Inner Race',
    fault_size_inches: 0.014,
    fault_size_mm: 0.356,
    severity: 'Moderate',
    prediction_probability: 0.9942,
    rms: 0.1982,
    kurtosis: 1.214,
    crest_factor: 4.331,
    shape_factor: 1.412,
    peak_to_peak: 0.825,
    skewness: 0.182,
    recommendation: 'Schedule dedicated bearing inspection, check race surfaces and ball elements for spalling.',
    urgency: 'Medium',
    model_used: '1D Deep CNN',
    model_version: 'cnn_cwru_1024_v1',
    sampling_rate_hz: 48000,
    signal_unit: 'g',
    source_type: 'csv',
    windows_analyzed: 4,
    source_filename: 'mill_spindle_test.csv',
    created_at: new Date('2026-08-20T10:30:00Z').toISOString()
  },
  {
    id: 2,
    machine_id: 1,
    machine_name: 'CNC Lathe Machine #1',
    bearing_status: 'Healthy',
    predicted_class: 'Normal',
    fault_type: 'Normal',
    fault_size_inches: 0.0,
    fault_size_mm: 0.0,
    severity: 'Healthy',
    prediction_probability: 0.9998,
    rms: 0.0658,
    kurtosis: -0.104,
    crest_factor: 3.092,
    shape_factor: 1.251,
    peak_to_peak: 0.412,
    skewness: 0.015,
    recommendation: 'Continue routine periodic condition monitoring. All vibration parameters within limits.',
    urgency: 'None',
    model_used: '1D Deep CNN',
    model_version: 'cnn_cwru_1024_v1',
    sampling_rate_hz: 48000,
    signal_unit: 'g',
    source_type: 'csv',
    windows_analyzed: 1,
    source_filename: 'lathe_bearing_check.csv',
    created_at: new Date('2026-08-21T08:15:00Z').toISOString()
  }
];

// ──────────────────────────────────────────────────────────────────────────────
// Health Check
// ──────────────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '3.0.0',
    system: 'AI-Driven Bearing Fault Detection and Diagnosis System',
    timestamp: new Date().toISOString()
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Machines CRUD
// ──────────────────────────────────────────────────────────────────────────────
app.get('/api/machines', async (req, res) => {
  try {
    const [machines] = await pool.query(`
      SELECT
        m.id, m.name, m.machine_type AS type, m.machine_type, m.location, m.created_at,
        mp.temperature, mp.vibration, mp.power_usage, mp.operational_hours, mp.tool_condition
      FROM machines m
      LEFT JOIN machine_parameters mp
        ON mp.machine_id = m.id
        AND mp.id = (
          SELECT id FROM machine_parameters WHERE machine_id = m.id ORDER BY recorded_at DESC LIMIT 1
        )
      ORDER BY m.created_at DESC
    `);
    res.json({ success: true, data: machines });
  } catch (err) {
    res.json({ success: true, data: inMemoryMachines, fallback: true });
  }
});

app.post('/api/machines', async (req, res) => {
  const { name, type, location, temperature, vibration, power_usage, operational_hours, tool_condition } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Machine name is required' });
  }

  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.query(
        'INSERT INTO machines (name, machine_type, location) VALUES (?, ?, ?)',
        [name.trim(), type || 'General Equipment', location || 'Workshop Floor']
      );
      const machineId = result.insertId;

      await conn.query(
        `INSERT INTO machine_parameters (machine_id, temperature, vibration, power_usage, operational_hours, tool_condition)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          machineId,
          parseFloat(temperature) || 40.0,
          parseFloat(vibration) || 1.0,
          parseFloat(power_usage) || 5.0,
          parseInt(operational_hours, 10) || 0,
          tool_condition != null && tool_condition !== '' ? parseFloat(tool_condition) : null
        ]
      );
      await conn.commit();
      res.status(201).json({ success: true, message: 'Machine created successfully', machine_id: machineId });
    } catch (dbErr) {
      await conn.rollback();
      throw dbErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    // In-memory fallback
    const newId = inMemoryMachines.length ? Math.max(...inMemoryMachines.map(m => m.id)) + 1 : 1;
    const newMachine = {
      id: newId,
      name: name.trim(),
      machine_type: type || 'General Equipment',
      type: type || 'General Equipment',
      location: location || 'Workshop Floor',
      temperature: parseFloat(temperature) || 40.0,
      vibration: parseFloat(vibration) || 1.0,
      power_usage: parseFloat(power_usage) || 5.0,
      operational_hours: parseInt(operational_hours, 10) || 0,
      tool_condition: tool_condition != null && tool_condition !== '' ? parseFloat(tool_condition) : null,
      created_at: new Date().toISOString()
    };
    inMemoryMachines.unshift(newMachine);
    res.status(201).json({ success: true, message: 'Machine added (memory mode)', machine_id: newId, fallback: true });
  }
});

app.put('/api/machines/:id', async (req, res) => {
  const machineId = parseInt(req.params.id, 10);
  const { name, type, location, temperature, vibration, power_usage, operational_hours, tool_condition } = req.body;

  try {
    await pool.query(
      'UPDATE machines SET name=?, machine_type=?, location=?, updated_at=NOW() WHERE id=?',
      [name, type || 'General Equipment', location || 'Workshop Floor', machineId]
    );
    await pool.query(
      `INSERT INTO machine_parameters (machine_id, temperature, vibration, power_usage, operational_hours, tool_condition)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        machineId,
        parseFloat(temperature) || 40.0,
        parseFloat(vibration) || 1.0,
        parseFloat(power_usage) || 5.0,
        parseInt(operational_hours, 10) || 0,
        tool_condition != null && tool_condition !== '' ? parseFloat(tool_condition) : null
      ]
    );
    res.json({ success: true, message: 'Machine updated successfully' });
  } catch (err) {
    const idx = inMemoryMachines.findIndex(m => m.id === machineId);
    if (idx !== -1) {
      inMemoryMachines[idx] = {
        ...inMemoryMachines[idx],
        name: name || inMemoryMachines[idx].name,
        machine_type: type || inMemoryMachines[idx].machine_type,
        type: type || inMemoryMachines[idx].type,
        location: location || inMemoryMachines[idx].location,
        temperature: temperature !== undefined ? parseFloat(temperature) : inMemoryMachines[idx].temperature,
        vibration: vibration !== undefined ? parseFloat(vibration) : inMemoryMachines[idx].vibration,
        power_usage: power_usage !== undefined ? parseFloat(power_usage) : inMemoryMachines[idx].power_usage,
        operational_hours: operational_hours !== undefined ? parseInt(operational_hours, 10) : inMemoryMachines[idx].operational_hours,
        tool_condition: tool_condition !== undefined ? (tool_condition !== '' ? parseFloat(tool_condition) : null) : inMemoryMachines[idx].tool_condition,
      };
      return res.json({ success: true, message: 'Machine updated (memory mode)', fallback: true });
    }
    res.status(404).json({ success: false, message: 'Machine not found' });
  }
});

app.delete('/api/machines/:id', async (req, res) => {
  const machineId = parseInt(req.params.id, 10);
  try {
    const [result] = await pool.query('DELETE FROM machines WHERE id = ?', [machineId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Machine not found' });
    }
    res.json({ success: true, message: 'Machine deleted successfully' });
  } catch (err) {
    inMemoryMachines = inMemoryMachines.filter(m => m.id !== machineId);
    inMemoryBearingHistory = inMemoryBearingHistory.filter(h => h.machine_id !== machineId);
    inMemorySchedule = inMemorySchedule.filter(s => s.machine_id !== machineId);
    res.json({ success: true, message: 'Machine deleted (memory mode)', fallback: true });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// Maintenance Schedule
// ──────────────────────────────────────────────────────────────────────────────
app.get('/api/schedule', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ms.*, m.name AS machine_name, m.machine_type
      FROM maintenance_schedule ms
      JOIN machines m ON ms.machine_id = m.id
      ORDER BY ms.scheduled_date ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.json({ success: true, data: inMemorySchedule, fallback: true });
  }
});

app.post('/api/schedule', async (req, res) => {
  const { machine_id, scheduled_date, estimated_duration_hours, task_description, priority } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO maintenance_schedule (machine_id, scheduled_date, estimated_duration_hours, task_description, priority)
       VALUES (?, ?, ?, ?, ?)`,
      [machine_id, scheduled_date, parseFloat(estimated_duration_hours) || 2.0, task_description, priority || 'Medium']
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    const mach = inMemoryMachines.find(m => m.id === parseInt(machine_id, 10));
    const newEntry = {
      id: inMemorySchedule.length ? Math.max(...inMemorySchedule.map(s => s.id)) + 1 : 1,
      machine_id: parseInt(machine_id, 10),
      machine_name: mach ? mach.name : 'Unknown Machine',
      machine_type: mach ? mach.machine_type : 'General Equipment',
      scheduled_date,
      estimated_duration_hours: parseFloat(estimated_duration_hours) || 2.0,
      task_description,
      priority: priority || 'Medium',
      status: 'Pending',
      created_at: new Date().toISOString()
    };
    inMemorySchedule.push(newEntry);
    res.status(201).json({ success: true, id: newEntry.id, fallback: true });
  }
});

app.put('/api/schedule/:id', async (req, res) => {
  const scheduleId = parseInt(req.params.id, 10);
  const { status } = req.body;
  try {
    await pool.query('UPDATE maintenance_schedule SET status = ? WHERE id = ?', [status, scheduleId]);
    res.json({ success: true });
  } catch (err) {
    const item = inMemorySchedule.find(s => s.id === scheduleId);
    if (item) item.status = status;
    res.json({ success: true, fallback: true });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// System Stats
// ──────────────────────────────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const [[totalMach]] = await pool.query('SELECT COUNT(*) AS count FROM machines');
    const [[totalDiag]] = await pool.query('SELECT COUNT(*) AS count FROM bearing_diagnoses');
    const [[faultDiag]] = await pool.query("SELECT COUNT(*) AS count FROM bearing_diagnoses WHERE bearing_status != 'Healthy'");
    const [[pendingSched]] = await pool.query("SELECT COUNT(*) AS count FROM maintenance_schedule WHERE status = 'Pending'");

    res.json({
      success: true,
      data: {
        total_machines: totalMach.count,
        total_diagnoses: totalDiag.count,
        fault_diagnoses: faultDiag.count,
        pending_maintenance: pendingSched.count
      }
    });
  } catch (err) {
    const totalMach = inMemoryMachines.length;
    const totalDiag = inMemoryBearingHistory.length;
    const faultDiag = inMemoryBearingHistory.filter(h => h.bearing_status !== 'Healthy').length;
    const pendingSched = inMemorySchedule.filter(s => s.status === 'Pending').length;

    res.json({
      success: true,
      data: {
        total_machines: totalMach,
        total_diagnoses: totalDiag,
        fault_diagnoses: faultDiag,
        pending_maintenance: pendingSched
      },
      fallback: true
    });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// BEARING FAULT DIAGNOSIS (Hero Feature)
// ──────────────────────────────────────────────────────────────────────────────

// POST /api/bearing-analysis — Analyze vibration signal via Python FastAPI and persist diagnosis
app.post('/api/bearing-analysis', async (req, res) => {
  try {
    const {
      signal,
      machine_id,
      sampling_rate_hz,
      signal_unit,
      source_type,
      source_filename,
      use_classical_ml
    } = req.body;

    if (!signal || !Array.isArray(signal) || signal.length < 1024) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_SIGNAL',
        message: `At least 1024 valid vibration samples are required (received ${signal ? signal.length : 0}).`
      });
    }

    // Call Python FastAPI ML Service
    let mlResponse;
    try {
      mlResponse = await fetch(`${PYTHON_ML_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signal,
          sampling_rate_hz: parseInt(sampling_rate_hz, 10) || 48000,
          signal_unit: signal_unit || 'g',
          source_type: source_type || 'csv',
          use_classical_ml: !!use_classical_ml
        })
      });
    } catch (connErr) {
      return res.status(503).json({
        success: false,
        error: 'ML_SERVICE_UNAVAILABLE',
        message: 'The AI Bearing Diagnosis service is offline. Please ensure the Python FastAPI microservice is running on port 8000.'
      });
    }

    if (!mlResponse.ok) {
      const errText = await mlResponse.text();
      return res.status(mlResponse.status).json({
        success: false,
        error: 'ML_INFERENCE_ERROR',
        message: `Inference failed: ${errText}`
      });
    }

    const diagnosis = await mlResponse.json();

    // Persist diagnosis to MySQL bearing_diagnoses (with in-memory fallback)
    const machineIdInt = machine_id ? parseInt(machine_id, 10) : null;
    let savedId = null;

    try {
      const [insertResult] = await pool.query(
        `INSERT INTO bearing_diagnoses (
          machine_id, bearing_status, predicted_class, fault_type, fault_size_inches,
          fault_size_mm, severity, prediction_probability, rms, kurtosis, crest_factor,
          shape_factor, peak_to_peak, skewness, recommendation, urgency, model_used,
          model_version, sampling_rate_hz, signal_unit, source_type, windows_analyzed,
          source_filename, raw_features_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          machineIdInt,
          diagnosis.bearing_status,
          diagnosis.predicted_class,
          diagnosis.fault_type,
          diagnosis.fault_size_inches,
          diagnosis.fault_size_mm,
          diagnosis.severity,
          diagnosis.prediction_probability,
          diagnosis.features.rms,
          diagnosis.features.kurtosis,
          diagnosis.features.crest_factor,
          diagnosis.features.shape_factor,
          diagnosis.features.peak_to_peak,
          diagnosis.features.skewness,
          diagnosis.recommendation,
          diagnosis.urgency,
          diagnosis.model_version.includes('CNN') ? '1D Deep CNN' : 'Random Forest',
          diagnosis.model_version,
          diagnosis.sampling_rate_hz,
          diagnosis.signal_unit,
          diagnosis.source_type,
          diagnosis.windows_analyzed,
          source_filename || 'uploaded_vibration.csv',
          JSON.stringify(diagnosis.features)
        ]
      );
      savedId = insertResult.insertId;

      // Auto-schedule maintenance if severe fault detected
      if (diagnosis.severity === 'Severe' && machineIdInt) {
        const schedDate = new Date();
        schedDate.setDate(schedDate.getDate() + 1);
        await pool.query(
          `INSERT INTO maintenance_schedule (machine_id, scheduled_date, estimated_duration_hours, task_description, priority)
           VALUES (?, ?, ?, ?, ?)`,
          [machineIdInt, schedDate.toISOString().split('T')[0], 4.0, `Priority bearing replacement: ${diagnosis.fault_type} (${diagnosis.severity})`, 'High']
        );
      }
    } catch (dbErr) {
      // In-memory persistence
      const mach = inMemoryMachines.find(m => m.id === machineIdInt);
      savedId = inMemoryBearingHistory.length ? Math.max(...inMemoryBearingHistory.map(h => h.id)) + 1 : 1;
      inMemoryBearingHistory.unshift({
        id: savedId,
        machine_id: machineIdInt,
        machine_name: mach ? mach.name : 'Unassigned Machine',
        bearing_status: diagnosis.bearing_status,
        predicted_class: diagnosis.predicted_class,
        fault_type: diagnosis.fault_type,
        fault_size_inches: diagnosis.fault_size_inches,
        fault_size_mm: diagnosis.fault_size_mm,
        severity: diagnosis.severity,
        prediction_probability: diagnosis.prediction_probability,
        rms: diagnosis.features.rms,
        kurtosis: diagnosis.features.kurtosis,
        crest_factor: diagnosis.features.crest_factor,
        shape_factor: diagnosis.features.shape_factor,
        peak_to_peak: diagnosis.features.peak_to_peak,
        skewness: diagnosis.features.skewness,
        recommendation: diagnosis.recommendation,
        urgency: diagnosis.urgency,
        model_used: diagnosis.model_version.includes('CNN') ? '1D Deep CNN' : 'Random Forest',
        model_version: diagnosis.model_version,
        sampling_rate_hz: diagnosis.sampling_rate_hz,
        signal_unit: diagnosis.signal_unit,
        source_type: diagnosis.source_type,
        windows_analyzed: diagnosis.windows_analyzed,
        source_filename: source_filename || 'uploaded_vibration.csv',
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      diagnosis_id: savedId,
      data: diagnosis
    });
  } catch (err) {
    console.error('Bearing analysis handler error:', err);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: err.message
    });
  }
});

// GET /api/bearing-history — Retrieve persistent diagnosis history with filters
app.get('/api/bearing-history', async (req, res) => {
  const { machine_id, severity, fault_type, search } = req.query;

  try {
    let query = `
      SELECT
        bd.*,
        m.name AS machine_name,
        m.machine_type
      FROM bearing_diagnoses bd
      LEFT JOIN machines m ON bd.machine_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (machine_id) {
      query += ' AND bd.machine_id = ?';
      params.push(parseInt(machine_id, 10));
    }
    if (severity) {
      query += ' AND bd.severity = ?';
      params.push(severity);
    }
    if (fault_type) {
      query += ' AND bd.fault_type = ?';
      params.push(fault_type);
    }
    if (search) {
      query += ' AND (m.name LIKE ? OR bd.predicted_class LIKE ? OR bd.source_filename LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY bd.created_at DESC LIMIT 100';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    let filtered = [...inMemoryBearingHistory];
    if (machine_id) {
      filtered = filtered.filter(h => h.machine_id === parseInt(machine_id, 10));
    }
    if (severity) {
      filtered = filtered.filter(h => h.severity === severity);
    }
    if (fault_type) {
      filtered = filtered.filter(h => h.fault_type === fault_type);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(h =>
        (h.machine_name && h.machine_name.toLowerCase().includes(s)) ||
        (h.predicted_class && h.predicted_class.toLowerCase().includes(s)) ||
        (h.source_filename && h.source_filename.toLowerCase().includes(s))
      );
    }
    res.json({ success: true, data: filtered, fallback: true });
  }
});

// GET /api/demo-samples — Curated CWRU demo samples from FastAPI
app.get('/api/demo-samples', async (req, res) => {
  try {
    const mlRes = await fetch(`${PYTHON_ML_URL}/demo-samples`);
    if (!mlRes.ok) throw new Error('ML service demo-samples returned error');
    const data = await mlRes.json();
    res.json(data);
  } catch (err) {
    // Graceful degraded fallback: return 200 with stub metadata (no actual signal arrays)
    // Frontend will show demo buttons but signals require FastAPI to be running
    res.json({
      success: true,
      ml_service_online: false,
      message: 'FastAPI ML service is offline. Start it with: python -m uvicorn ml.api.ml_server:app --port 8000',
      samples: {
        Normal:    { class: 'Normal',       fault_type: 'Normal',       severity: 'Healthy',  defect_size_inches: 0.000, sampling_rate_hz: 48000, signal_unit: 'g', signal: null },
        Ball_007:  { class: 'Ball_007',     fault_type: 'Ball',         severity: 'Mild',     defect_size_inches: 0.007, sampling_rate_hz: 48000, signal_unit: 'g', signal: null },
        Ball_014:  { class: 'Ball_014',     fault_type: 'Ball',         severity: 'Moderate', defect_size_inches: 0.014, sampling_rate_hz: 48000, signal_unit: 'g', signal: null },
        IR_014:    { class: 'IR_014',       fault_type: 'Inner Race',   severity: 'Moderate', defect_size_inches: 0.014, sampling_rate_hz: 48000, signal_unit: 'g', signal: null },
        IR_021:    { class: 'IR_021',       fault_type: 'Inner Race',   severity: 'Severe',   defect_size_inches: 0.021, sampling_rate_hz: 48000, signal_unit: 'g', signal: null },
        OR_014:    { class: 'OR_014',       fault_type: 'Outer Race',   severity: 'Moderate', defect_size_inches: 0.014, sampling_rate_hz: 48000, signal_unit: 'g', signal: null }
      }
    });
  }
});

// GET /api/bearing-models — Model comparison metadata & evaluation results
app.get('/api/bearing-models', (req, res) => {
  try {
    const metaPath = path.join(__dirname, '..', 'ml', 'saved_models', 'model_metadata_v1.json');
    const resultsPath = path.join(__dirname, '..', 'ml', 'evaluation', 'all_model_results.json');

    let metadata = {};
    let results = [];

    if (fs.existsSync(metaPath)) {
      metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    }
    if (fs.existsSync(resultsPath)) {
      results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    }

    res.json({
      success: true,
      data: {
        metadata,
        results,
        selected_production_model: '1D Deep CNN (cnn_cwru_1024_v1.keras)'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// Start Node Express Server
// ──────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(` WORKSHOP MAINTENANCE BACKEND API RUNNING ON PORT ${PORT}`);
  console.log(` Health Check:  http://localhost:${PORT}/api/health`);
  console.log(` ML Endpoint:   ${PYTHON_ML_URL}/predict`);
  console.log(`=============================================================\n`);
});
