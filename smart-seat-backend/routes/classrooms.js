const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

const dbConfig = {
  host: 'cp3405-tr3-2025-p1t1-mysql-1',
  user: 'root',
  password: 'asdfgh123',
  database: 'smart_seat',
};

router.get('/', async (req, res) => {
  try {
    const hour = req.query.hour !== undefined ? parseInt(req.query.hour) : null;
    if (hour === null || isNaN(hour) || hour < 0 || hour > 23) {
      return res.status(400).json({ message: 'Invalid or missing hour parameter (0-23)' });
    }

    const date = new Date().toISOString().slice(0, 10);
    const connection = await mysql.createConnection(dbConfig);

    const [classrooms] = await connection.execute('SELECT * FROM classrooms');

    for (const classroom of classrooms) {
      const seats = {};

      const startTime = `${date}T${hour.toString().padStart(2, '0')}:00`;
      const [bookings] = await connection.execute(
        'SELECT seatNumber FROM bookings WHERE classroom = ? AND startTime = ?',
        [classroom.name, startTime]
      );

      bookings.forEach(b => {
        seats[b.seatNumber] = true;
      });

      classroom.seats = seats;
    }

    await connection.end();
    res.json({ date, hour, classrooms });
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:classroom', async (req, res) => {
  try {
    const hour = req.query.hour !== undefined ? parseInt(req.query.hour) : null;
    if (hour === null || isNaN(hour) || hour < 0 || hour > 23) {
      return res.status(400).json({ message: 'Invalid or missing hour parameter (0-23)' });
    }

    const date = new Date().toISOString().slice(0, 10);
    const connection = await mysql.createConnection(dbConfig);

    const [classrooms] = await connection.execute('SELECT * FROM classrooms WHERE name = ?', [req.params.classroom]);
    if (classrooms.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Classroom not found' });
    }

    const classroom = classrooms[0];
    const seats = {};

    const startTime = `${date}T${hour.toString().padStart(2, '0')}:00`;
    const [bookings] = await connection.execute(
      'SELECT seatNumber FROM bookings WHERE classroom = ? AND startTime = ?',
      [classroom.name, startTime]
    );

    bookings.forEach(b => {
      seats[b.seatNumber] = true;
    });

    classroom.seats = seats;

    await connection.end();
    res.json({ date, hour, classroom });
  } catch (error) {
    console.error('Error fetching classroom:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;