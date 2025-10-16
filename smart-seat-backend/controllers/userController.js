const pool = require('../db/pool');

exports.getAllUsers = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [users] = await connection.execute(`
      SELECT id, email, name, password, role, birthday, gender, major, jcu_id
      FROM users
    `);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

exports.getMe = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const userId = req.headers['user-id'];
    if (userId && isNaN(Number(userId))) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const sql = userId ?
      'SELECT id, email, role, birthday, gender, major, jcu_id, name FROM users WHERE id = ?' :
      'SELECT id, email, role, birthday, gender, major, jcu_id, name FROM users LIMIT 1';
    const [users] = await connection.execute(sql, userId ? [userId] : []);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

exports.getUserById = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [users] = await connection.execute(`
      SELECT id, email, name, password, role, birthday, gender, major, jcu_id
      FROM users
      WHERE id = ?
    `, [req.params.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

exports.updateUser = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const userId = req.params.id;
    const { email, birthday, oldPassword, newPassword } = req.body;
    const [existingUsers] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);
    if (existingUsers.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    let finalPassword = existingUsers[0].password;
    if (oldPassword && newPassword) {
      if (existingUsers[0].password !== oldPassword) {
        return res.status(400).json({ message: 'Old password is incorrect' });
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
    res.json({ success: true, user: updatedUsers[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};