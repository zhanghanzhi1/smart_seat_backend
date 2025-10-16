const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'cp3405-tr3-2025-p1t1-mysql-1',
  user: 'root',
  password: 'asdfgh123',
  database: 'smart_seat',
};

exports.getClassroomWithSeats = async (req, res) => {
  try {
    let { classroom, date, hour } = req.query;

    if (!classroom) return res.status(400).json({ message: 'Missing classroom' });
    if (hour === undefined) return res.status(400).json({ message: 'Missing hour parameter' });

    if (!date) date = new Date().toISOString().split('T')[0];
    
    const start_time = `${hour.toString().padStart(2, '0')}:00`;
    const room = classroom;

    const connection = await mysql.createConnection(dbConfig);

    const sql = `
      SELECT b.seat_number, b.book_id, b.book_name
      FROM bookings b
      WHERE b.room = ? AND b.date = ? AND b.start_time = ?
    `;
    const params = [room, date, start_time];

    const [bookings] = await connection.execute(sql, params);

    const seats = {};
    bookings.forEach(b => {
      seats[b.seat_number] = { userId: b.book_id, userName: b.book_name };
    });

    await connection.end();

    res.json({
      seats,
      start_time,
      date
    });
  } catch (error) {
    console.error('Error fetching classroom:', error);
    res.status(500).json({ message: 'Server error' });
  }
};