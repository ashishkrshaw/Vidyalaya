const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../local-storage/student_management.sqlite');
const db = new sqlite3.Database(dbPath);

router.get('/', (req, res) => {
  // Get total students
  db.get('SELECT COUNT(*) as totalStudents FROM admissions', (err, studentRow) => {
    if (err) return res.status(500).json({ error: err.message });
    // Get total fee collected
    db.get('SELECT SUM(amount) as totalFee FROM fee_payments', (err, feeRow) => {
      if (err) return res.status(500).json({ error: err.message });
      // Get total outstanding dues
      db.get('SELECT SUM(due) as totalDues FROM fee_payments', (err, duesRow) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          totalStudents: studentRow.totalStudents || 0,
          totalFee: feeRow.totalFee || 0,
          totalDues: duesRow.totalDues || 0
        });
      });
    });
  });
});

module.exports = router;
