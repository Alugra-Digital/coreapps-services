import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import { applySecurityMiddleware } from '../../../shared/middleware/security.middleware.js';

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = 3001;

// Security: Helmet, CORS whitelist, XSS sanitization, input sanitization, HPP
applySecurityMiddleware(app);
app.use(morgan('combined'));

// Auth Routes
app.use('/', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service', timestamp: new Date() });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Auth Service running on port ${PORT}`);
  });
}

export default app;
