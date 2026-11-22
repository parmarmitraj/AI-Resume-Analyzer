const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const { connectDB } = require('./config/db');
const jobRoutes = require('./routes/jobRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.method !== 'OPTIONS') {
    console.log(`[API] ${req.method} ${req.url}`);
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api', jobRoutes);
app.use('/api', resumeRoutes);

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'AI Resume Analyzer & Recruitment Platform API',
    version: '2.0.0',
    documentation: 'See API_SUMMARY.txt for endpoint schemas'
  });
});

app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Node.js Backend listening on http://localhost:${PORT}`);
    console.log(`📡 Endpoints mounted at /api/jobs and /api/student`);
    console.log(`=======================================================`);
  });
}

startServer();
