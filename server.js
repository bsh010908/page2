// server.js
const express = require('express');
const mysql = require('mysql2'); // MySQL 연동
require('dotenv').config(); // .env 사용 시

const app = express();
app.use(express.json());

// MySQL 연결 설정
const db = mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'wishket_user',
  password: process.env.DB_PASSWORD || 'wishket_pass',
  database: process.env.DB_NAME || 'front_wishket'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Database connected successfully!');
  }
});

// 기본 라우트
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// 포트 설정 (환경변수 PORT 우선, 없으면 3000)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running at http://127.0.0.1:${PORT}`);
});
