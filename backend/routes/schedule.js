const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all scheduled maintenance
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ms.*, m.name AS machine_name, m.type AS machine_type
      FROM maintenance_schedule ms
      JOIN machines m ON ms.machine_id = m.id
      ORDER BY ms.scheduled_date ASC, ms.priority DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT — Update maintenance status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await db.query('UPDATE maintenance_schedule SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Schedule updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
