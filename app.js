const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const dbConfig = require('./dbConfig');
const databaseRoutes = require('./wms-api');
const client = require('prom-client');
const actuator = require('express-actuator');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerDocument = require('./swagger.json');

const app = express();
const SECRET_KEY = 'edumgtedumgt';

// Body parsing
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// CORS 설정
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://kegdemo.edumgt.co.kr:3000'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));



// 정적 파일 및 이미지 업로드
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });
app.use('/uploads', express.static('public/uploads'));
app.post('/upload/image', upload.single('image'), (req, res) => {
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Prometheus 메트릭 수집
client.collectDefaultMetrics();
const requestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route']
});
app.use((req, res, next) => {
  res.on('finish', () => {
    requestCounter.labels(req.method, req.route?.path || req.path).inc();
  });
  next();
});
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
app.get('/actuator/prometheus', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// actuator 설정
app.use(actuator({ basePath: '/actuator' }));

// Swagger 문서화
const options = {
  swaggerDefinition: swaggerDocument,
  apis: ['./wms-api.js', './server.js']
};
const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// JWT 로그인
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === '1111') {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
});

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

app.get('/protected', authenticateJWT, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// 기본 경로
// 확장자 없이 HTML 파일 접근
app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, 'public', `${page}.html`);
  res.sendFile(filePath, (err) => {
    if (err) {
      next(); // 파일 없을 경우 404로 넘기기
    }
  });
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// DB API 라우트
app.use('/api', databaseRoutes);

module.exports = app;