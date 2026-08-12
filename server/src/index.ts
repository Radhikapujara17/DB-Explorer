import express from 'express';
import cors from 'cors';
import { CONFIG } from './config/index.js';
import router from './routes/index.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Base Route
app.use('/api', router);

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(CONFIG.PORT, () => {
  console.log(`🚀 Database Explorer Server running on port ${CONFIG.PORT}`);
});
