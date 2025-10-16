const pool = require('../db/pool');

exports.getAllBookings = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const userId = req.query.userId;
    
    let query = `
      SELECT b.id, b.book_id, b.book_name, b.room, b.seat_number, b.date, b.start_time, b.end_time, b.status
      FROM bookings b
    `;
    const params = [];
    
    if (userId) {
      query += ' WHERE b.book_id = ?';
      params.push(userId);
    }
    
    const [bookings] = await connection.execute(query, params);
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

exports.getBookingById = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [bookings] = await connection.execute(`
      SELECT b.id, b.book_id, b.book_name, b.room, b.seat_number, b.date, b.start_time, b.end_time, b.status
      FROM bookings b
      WHERE b.id = ?
    `, [req.params.id]);
    if (bookings.length === 0) return res.status(404).json({ message: 'booking not found' });
    res.json(bookings[0]);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

exports.createbooking = async (req, res) => {
  let connection;
  try { 
    connection = await pool.getConnection();
    const { book_id, book_name, room, seat_number, date, start_time, end_time } = req.body;
    if (!book_id || !book_name || !room || seat_number === undefined || !date || !start_time || !end_time) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const [conflicts] = await connection.execute(
      `SELECT * FROM bookings 
       WHERE room = ? AND seat_number = ? 
         AND date = ? AND start_time = ?`,
      [room, seat_number, date, start_time]
    );
    if (conflicts.length > 0) {
      return res.status(409).json({ message: 'Seat already booked in this time range' });
    }
    const [result] = await connection.execute(
      `INSERT INTO bookings (room, seat_number, date, start_time, end_time, book_name, book_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [room, seat_number, date, start_time, end_time, book_name, book_id]
    );
    const [newbooking] = await connection.execute('SELECT * FROM bookings WHERE id = ?', [result.insertId]);
    res.status(201).json(newbooking[0]);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

exports.updatebooking = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const bookingId = req.params.id;
    const [existing] = await connection.execute('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'booking not found' });
    }
    const fields = [];
    const values = [];
    for (const key in req.body) {
      fields.push(`${key} = ?`);
      values.push(req.body[key]);
    }
    values.push(bookingId);
    const sql = `UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`;
    await connection.execute(sql, values);
    const [updatedbooking] = await connection.execute('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    res.json(updatedbooking[0]);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

exports.deletebooking = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const bookingId = req.params.id;
    const [existing] = await connection.execute('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'booking not found' });
    }
    await connection.execute('DELETE FROM bookings WHERE id = ?', [bookingId]);
    res.json({ message: 'booking deleted', booking: existing[0] });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

exports.getBookedSeats = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { room, date, start_time, end_time } = req.query;
    const [results] = await connection.execute(
      `SELECT b.*, u.jcu_id 
       FROM bookings b
       LEFT JOIN users u ON b.book_id = u.id
       WHERE room = ? 
       AND date = ? 
       AND start_time = ? 
       AND end_time = ?`,
      [room, date, start_time, end_time]
    );
    res.json(results);
  } catch (error) {
    console.error('Error fetching booked seats:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

exports.cancelBooking = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const bookingId = req.params.id;
    const [existing] = await connection.execute('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'booking not found' });
    }
    await connection.execute(
      'UPDATE bookings SET status = 2 WHERE id = ?',
      [bookingId]
    );
    const [updatedBooking] = await connection.execute('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    res.json(updatedBooking[0]);
  } catch (error) {
    console.error('Error canceling booking:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

exports.updateExpiredBookings = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'Missing userId' });
    
    const [expiredBookings] = await connection.execute(
      'SELECT id FROM bookings WHERE book_id = ? AND status = 0 AND CONCAT(date, " ", start_time) < NOW()',
      [userId]
    );
    
    if (expiredBookings.length === 0) {
      return res.json({ message: 'No expired bookings to update' });
    }
    
    const ids = expiredBookings.map(booking => booking.id);
    await connection.execute(
      `UPDATE bookings SET status = 1 WHERE id IN (${ids.join(',')})`,
      []
    );
    
    const [updatedBookings] = await connection.execute(
      'SELECT * FROM bookings WHERE id IN (?)',
      [ids]
    );
    
    res.json(updatedBookings);
  } catch (error) {
    console.error('Error updating expired bookings:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};
