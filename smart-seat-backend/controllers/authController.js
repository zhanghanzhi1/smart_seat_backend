const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'cp3405-tr3-2025-p1t1-mysql-1',
  user: 'root',
  password: 'asdfgh123',
  database: 'smart_seat',
};

exports.register = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [existing] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const [result] = await connection.execute(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, password, role]
    );

    const [users] = await connection.execute(
      'SELECT id, email, role FROM users WHERE id = ?',
      [result.insertId]
    );

    res.json({ success: true, user: users[0] });
  } catch (err) {
    console.error('Register error:', err.stack);
    res.status(500).json({ success: false, message: 'Registration failed' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute(
      'SELECT id, email, role, name FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        profileCompleted: !!user.name 
      } 
    });
  } catch (err) {
    console.error('Login error:', err.stack);
    res.status(500).json({ success: false, message: 'Login failed' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

exports.profile = async (req, res) => {
  const { email, name, jcu_id, gender, birthday, major, role } = req.body;

  if (!email || !name || !jcu_id || !gender || !birthday) {
    return res.status(400).json({ success: false, message: 'All required fields must be provided' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [existing] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await connection.execute(
      `UPDATE users SET name = ?, jcu_id = ?, gender = ?, birthday = ?, 
       major = ?, role = ? WHERE email = ?`,
      [name, jcu_id, gender, birthday, major || null, role, email]
    );

    const [updatedUsers] = await connection.execute(
      'SELECT id, email, role, name FROM users WHERE email = ?',
      [email]
    );

    res.json({ 
      success: true, 
      user: {
        id: updatedUsers[0].id,
        email: updatedUsers[0].email,
        role: updatedUsers[0].role,
        profileCompleted: true
      } 
    });
  } catch (err) {
    console.error('Profile update error:', err.stack);
    res.status(500).json({ success: false, message: 'Profile update failed' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

exports.logout = async (req, res) => {
  try {
    res.json({ success: true, message: 'Logout successful' });
  } catch (err) {
    console.error('Logout error:', err.stack);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};