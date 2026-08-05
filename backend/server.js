const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app  = express();
app.use(cors());
app.use(express.json());

const pool   = require('./db');
const { predict } = require('./predictionEngine');

// ──────────────────────────────────────────────────────────────────────────────
// Health check
// ──────────────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/machines  — all machines with latest parameters & prediction
// FIX: uses correct table names (predictions, machine_type column)
// ──────────────────────────────────────────────────────────────────────────────
app.get('/api/machines', async (req, res) => {
  try {
    const [machines] = await pool.query(`
      SELECT
        m.id, m.name, m.machine_type AS type, m.location, m.created_at,
        mp.temperature, mp.vibration, mp.power_usage,
        mp.tool_condition, mp.operational_hours,
        mp.recorded_at AS params_recorded_at,
        p.risk_score, p.status, p.confidence,
        p.days_until_maintenance, p.recommended_action, p.priority
      FROM machines m
      LEFT JOIN machine_parameters mp
        ON mp.machine_id = m.id
        AND mp.id = (
          SELECT id FROM machine_parameters
          WHERE machine_id = m.id
          ORDER BY recorded_at DESC LIMIT 1
        )
      LEFT JOIN predictions p
        ON p.machine_id = m.id
        AND p.id = (
          SELECT id FROM predictions
          WHERE machine_id = m.id
          ORDER BY predicted_at DESC LIMIT 1
        )
      ORDER BY m.created_at DESC
    `);
    res.json({ success: true, data: machines });
  } catch (err) {
    console.error('GET /machines error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/machines  — add new machine
// FIX: machine_type column, NULL tool_condition for non-CNC, operational_hours
//      passed to prediction engine, correct table names
// ──────────────────────────────────────────────────────────────────────────────
app.post('/api/machines', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      name, type, location,
      temperature, vibration, power_usage,
      tool_condition, operational_hours,
    } = req.body;

    if (!name || !name.trim())
      return res.status(400).json({ success: false, message: 'Machine name is required' });

    // ── 1. Insert machine (use machine_type column) ──────────────────────────
    const [machineResult] = await conn.query(
      'INSERT INTO machines (name, machine_type, location) VALUES (?, ?, ?)',
      [name.trim(), type || 'General Equipment', location || 'Workshop Floor']
    );
    const machineId = machineResult.insertId;

    // ── 2. Parse parameters ──────────────────────────────────────────────────
    const temp = parseFloat(temperature)        || 40;
    const vib  = parseFloat(vibration)          || 1.0;
    const pwr  = parseFloat(power_usage)        || 5.0;
    const hrs  = parseFloat(operational_hours)  || 0;

    // FIX: tool_condition is NULL when not provided (EXCEPTION for non-CNC)
    const tool = (tool_condition !== undefined && tool_condition !== null && tool_condition !== '')
      ? parseFloat(tool_condition)
      : null;

    // ── 3. Store parameters ──────────────────────────────────────────────────
    await conn.query(
      `INSERT INTO machine_parameters
         (machine_id, temperature, vibration, power_usage, operational_hours, tool_condition)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [machineId, temp, vib, pwr, hrs, tool]
    );

    // ── 4. Run AI prediction (FIX: operational_hours passed in) ─────────────
    const predResult = predict({ temperature: temp, vibration: vib, power_usage: pwr, operational_hours: hrs, tool_condition: tool });
    console.log(`[predict] machine_id=${machineId}`, predResult._breakdown);

    // ── 5. Store prediction ──────────────────────────────────────────────────
    await conn.query(
      `INSERT INTO predictions
         (machine_id, risk_score, status, confidence, days_until_maintenance, recommended_action, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [machineId, predResult.risk_score, predResult.status, predResult.confidence,
       predResult.days_until_maintenance, predResult.recommended_action, predResult.priority]
    );

    // ── 6. Auto-create schedule entry for non-healthy machines ───────────────
    if (predResult.status !== 'Healthy') {
      const schedDate = new Date();
      schedDate.setDate(schedDate.getDate() + predResult.days_until_maintenance);
      await conn.query(
        `INSERT INTO maintenance_schedule
           (machine_id, scheduled_date, estimated_duration_hours, task_description, priority)
         VALUES (?, ?, ?, ?, ?)`,
        [
          machineId,
          schedDate.toISOString().split('T')[0],
          predResult.status === 'Critical' ? 4.0 : 2.0,
          predResult.recommended_action,
          predResult.priority,
        ]
      );
    }

    await conn.commit();
    res.status(201).json({
      success: true,
      message: 'Machine added successfully',
      machine_id: machineId,
      prediction: predResult,
    });
  } catch (err) {
    await conn.rollback();
    console.error('POST /machines error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// PUT /api/machines/:id  — update machine + re-run prediction
// FIX: machine_type column, NULL tool_condition, operational_hours in predict
// ──────────────────────────────────────────────────────────────────────────────
app.put('/api/machines/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      name, type, location,
      temperature, vibration, power_usage,
      tool_condition, operational_hours,
    } = req.body;

    // FIX: update machine_type column (not 'type')
    await conn.query(
      'UPDATE machines SET name=?, machine_type=?, location=?, updated_at=NOW() WHERE id=?',
      [name, type || 'General Equipment', location || 'Workshop Floor', req.params.id]
    );

    const temp = parseFloat(temperature)       || 40;
    const vib  = parseFloat(vibration)         || 1.0;
    const pwr  = parseFloat(power_usage)       || 5.0;
    const hrs  = parseFloat(operational_hours) || 0;

    // FIX: NULL when not provided
    const tool = (tool_condition !== undefined && tool_condition !== null && tool_condition !== '')
      ? parseFloat(tool_condition)
      : null;

    await conn.query(
      `INSERT INTO machine_parameters
         (machine_id, temperature, vibration, power_usage, operational_hours, tool_condition)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.params.id, temp, vib, pwr, hrs, tool]
    );

    // FIX: operational_hours passed to prediction engine
    const predResult = predict({ temperature: temp, vibration: vib, power_usage: pwr, operational_hours: hrs, tool_condition: tool });
    console.log(`[predict] update machine_id=${req.params.id}`, predResult._breakdown);

    await conn.query(
      `INSERT INTO predictions
         (machine_id, risk_score, status, confidence, days_until_maintenance, recommended_action, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, predResult.risk_score, predResult.status, predResult.confidence,
       predResult.days_until_maintenance, predResult.recommended_action, predResult.priority]
    );

    await conn.commit();
    res.json({ success: true, message: 'Machine updated', prediction: predResult });
  } catch (err) {
    await conn.rollback();
    console.error('PUT /machines error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// DELETE /api/machines/:id  — cascade handled by FK constraints
// ──────────────────────────────────────────────────────────────────────────────
app.delete('/api/machines/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM machines WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Machine not found' });
    res.json({ success: true, message: 'Machine deleted successfully' });
  } catch (err) {
    console.error('DELETE /machines error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/schedule  — maintenance schedule ordered by date
// FIX: uses maintenance_schedule table (correct name)
// ──────────────────────────────────────────────────────────────────────────────
app.get('/api/schedule', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ms.*, m.name AS machine_name, m.machine_type AS machine_type
      FROM maintenance_schedule ms
      JOIN machines m ON ms.machine_id = m.id
      ORDER BY ms.scheduled_date ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /schedule error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// PUT /api/schedule/:id  — update schedule entry status
// ──────────────────────────────────────────────────────────────────────────────
app.put('/api/schedule/:id', async (req, res) => {
  try {
    await pool.query(
      'UPDATE maintenance_schedule SET status = ? WHERE id = ?',
      [req.body.status, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /schedule error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/stats  — dashboard summary stats
// ──────────────────────────────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const [[total]]    = await pool.query('SELECT COUNT(*) AS count FROM machines');
    const [[critical]] = await pool.query(`
      SELECT COUNT(*) AS count FROM predictions p
      WHERE p.status = 'Critical'
        AND p.id = (SELECT id FROM predictions WHERE machine_id = p.machine_id ORDER BY predicted_at DESC LIMIT 1)
    `);
    const [[pending]]  = await pool.query(
      "SELECT COUNT(*) AS count FROM maintenance_schedule WHERE status = 'Pending'"
    );
    res.json({
      success: true,
      data: {
        total_machines:    total.count,
        critical_machines: critical.count,
        pending_tasks:     pending.count,
      },
    });
  } catch (err) {
    console.error('GET /stats error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// Start server
// ──────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Workshop Maintenance API  →  http://localhost:${PORT}`);
  console.log(`📊 Health check             →  http://localhost:${PORT}/api/health\n`);
});
