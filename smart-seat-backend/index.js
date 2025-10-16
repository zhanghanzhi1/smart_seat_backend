const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: 'https://smart-seat-frontend-fc6d.vercel.app', // 前端开发环境地址（根据实际前端端口调整）
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // 允许的请求方法（前端有用到POST）
  allowedHeaders: ['Content-Type'], // 允许的请求头（前端未使用自定义头部，默认Content-Type即可）
  credentials: true // 若前端请求需要携带cookie等凭证，需设为true（根据你的需求选择）
}));
app.use(express.json());

// 测试根路由
app.get('/', (req, res) => {
  res.send('Smart Seat Backend is running!');
});

// ✅ 挂载路由
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/usersRoutes');
const bookingsRoutes = require('./routes/bookings');
const classroomsRoutes = require('./routes/classrooms');

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/classrooms', classroomsRoutes);

// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
