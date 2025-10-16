const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT id, email, name, password, role, birthday, gender, major, jcu_id
      FROM users
    `);
    res.json(users);
  } catch (error) {
    console.error('fail to load user:', error);
    res.status(500).json({ error: 'Failed to read users' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    if (userId && isNaN(Number(userId))) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const sql = userId ?
      'SELECT id, email, role, birthday, gender, major, jcu_id, name FROM users WHERE id = ?' :
      'SELECT id, email, role, birthday, gender, major, jcu_id, name FROM users LIMIT 1';
    const [users] = await pool.execute(sql, userId ? [userId] : []);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(users[0]);
  } catch (error) {
    console.error('fail to load user:', error);
    res.status(500).json({ error: 'Failed to get current user' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT id, email, name, password, role, birthday, gender, major, jcu_id
      FROM users
      WHERE id = ?
    `, [req.params.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(users[0]);
  } catch (error) {
    console.error('fail to load user:', error);
    res.status(500).json({ error: 'Failed to read user' });
  }
});

router.put('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.params.id;
    const { email, birthday, oldPassword, newPassword } = req.body;
    const [existingUsers] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);
    if (existingUsers.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'User not found' });
    }
    let finalPassword = existingUsers[0].password;
    if (oldPassword && newPassword) {
      if (existingUsers[0].password !== oldPassword) {
        connection.release();
        return res.status(400).json({ error: 'Old password is incorrect' });
      }
      finalPassword = newPassword;
    }
    await connection.execute(
      'UPDATE users SET email = ?, birthday = ?, password = ? WHERE id = ?',
      [
        email || existingUsers[0].email,
        birthday || existingUsers[0].birthday,
        finalPassword,
        userId
      ]
    );
    const [updatedUsers] = await connection.execute(
      'SELECT id, email, name, role, birthday, gender, major, jcu_id FROM users WHERE id = ?',
      [userId]
    );
    connection.release();
    res.json({ success: true, user: updatedUsers[0] });
  } catch (error) {
    connection.release();
    console.error('fail to update user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

module.exports = router;