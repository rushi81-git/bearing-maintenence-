const express = require('express');
const router = express.Router();
const db = require('../db');
const { predict } = require('../predictionEngine');

// GET all machines with latest parameters and predictions
router.get('/', async (req, res) => {
  try {
    const [machines] = await db.query(`
      SELECT m.*,
        mp.temperature, mp.vibration, mp.power_usage, mp.tool_condition,
        mp.operational_hours, mp.recorded_at AS params_recorded_at,
        p.risk_score, p.status, p.confidence, p.days_until_maintenance,
        p.recommended_action, p.priority
      FROM machines m
      LEFT JOIN machine_parameters mp ON mp.machine_id = m.id
        AND mp.id = (SELECT id FROM machine_parameters WHERE machine_id = m.id ORDER BY recorded_at DESC LIMIT 1)
      LEFT JOIN predictions p ON p.machine_id = m.id
        AND p.id = (SELECT id FROM predictions WHERE machine_id = m.id ORDER BY predicted_at DESC LIMIT 1)
      ORDER BY m.created_at DESC
    `);
    res.json({ success: true, data: machines });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single machine
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*,
        mp.temperature, mp.vibration, mp.power_usage, mp.tool_condition, mp.operational_hours,
        p.risk_score, p.status, p.confidence, p.days_until_maintenance,
        p.recommended_action, p.priority
      FROM machines m
      LEFT JOIN machine_parameters mp ON mp.machine_id = m.id
        AND mp.id = (SELECT id FROM machine_parameters WHERE machine_id = m.id ORDER BY recorded_at DESC LIMIT 1)
      LEFT JOIN predictions p ON p.machine_id = m.id
        AND p.id = (SELECT id FROM predictions WHERE machine_id = m.id ORDER BY predicted_at DESC LIMIT 1)
      WHERE m.id = ?
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Machine not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST — Add new machine with parameters
router.post('/', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { name, type, location, temperature, vibration, power_usage, tool_condition, operational_hours } = req.body;

    if (!name || temperature == null || vibration == null || power_usage == null || tool_condition == null) {
      return res.status(400).json({ success: false, message: 'Missing required fields: name, temperature, vibration, power_usage, tool_condition' });
    }

    // Insert machine
    const [machineResult] = await conn.query(
      'INSERT INTO machines (name, type, location) VALUES (?, ?, ?)',
      [name, type || 'General Equipment', location || 'Workshop Floor']
    );
    const machineId = machineResult.insertId;

    // Insert parameters (operational_hours stored but NOT used in prediction)
    await conn.query(
      'INSERT INTO machine_parameters (machine_id, temperature, vibration, power_usage, tool_condition, operational_hours) VALUES (?, ?, ?, ?, ?, ?)',
      [machineId, temperature, vibration, power_usage, tool_condition, operational_hours || 0]
    );

    // Run AI prediction (operational_hours intentionally excluded from prediction)
    const predResult = predict({ temperature, vibration, power_usage, tool_condition });

    await conn.query(
      `INSERT INTO predictions (machine_id, risk_score, status, confidence, days_until_maintenance, recommended_action, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [machineId, predResult.risk_score, predResult.status, predResult.confidence,
       predResult.days_until_maintenance, predResult.recommended_action, predResult.priority]
    );

    // Auto-schedule maintenance if not healthy
    if (predResult.status !== 'Healthy') {
      const schedDate = new Date();
      schedDate.setDate(schedDate.getDate() + predResult.days_until_maintenance);
      await conn.query(
        `INSERT INTO maintenance_schedule (machine_id, scheduled_date, estimated_duration_hours, task_description, priority)
         VALUES (?, ?, ?, ?, ?)`,
        [machineId, schedDate.toISOString().split('T')[0],
         predResult.status === 'Critical' ? 4.0 : 2.0,
         predResult.recommended_action, predResult.priority]
      );
    }

    await conn.commit();
    res.status(201).json({
      success: true,
      message: 'Machine added successfully',
      machine_id: machineId,
      prediction: predResult
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// PUT — Update machine parameters and re-predict
router.put('/:id', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { name, type, location, temperature, vibration, power_usage, tool_condition, operational_hours } = req.body;

    // Update machine info
    await conn.query(
      'UPDATE machines SET name=?, type=?, location=? WHERE id=?',
      [name, type, location, req.params.id]
    );

    // Insert new parameter record
    await conn.query(
      'INSERT INTO machine_parameters (machine_id, temperature, vibration, power_usage, tool_condition, operational_hours) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, temperature, vibration, power_usage, tool_condition, operational_hours || 0]
    );

    // Re-run AI prediction
    const predResult = predict({ temperature, vibration, power_usage, tool_condition });

    await conn.query(
      `INSERT INTO predictions (machine_id, risk_score, status, confidence, days_until_maintenance, recommended_action, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, predResult.risk_score, predResult.status, predResult.confidence,
       predResult.days_until_maintenance, predResult.recommended_action, predResult.priority]
    );

    await conn.commit();
    res.json({ success: true, message: 'Machine updated', prediction: predResult });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// DELETE — Remove machine (cascades to params, predictions, schedule)
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM machines WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Machine not found' });
    }
    res.json({ success: true, message: 'Machine and all related records deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
