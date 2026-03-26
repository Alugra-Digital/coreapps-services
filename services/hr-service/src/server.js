import express from 'express';
import morgan from 'morgan';
import { morganStream } from '../../shared/utils/logger.js';
import dotenv from 'dotenv';
import hrRoutes from './routes/hr.routes.js';
import { applySecurityMiddleware } from '../../shared/middleware/security.middleware.js';

dotenv.config({ path: '../../../.env' });

const app = express();
const PORT = 3004;

// Security: Helmet, CORS whitelist, XSS sanitization, input sanitization, HPP
applySecurityMiddleware(app);
app.use(morgan('combined', { stream: morganStream }));

// HR Routes
app.use('/', hrRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hr-service', timestamp: new Date() });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`HR Service running on port ${PORT}`);
  });
}

export default app;
