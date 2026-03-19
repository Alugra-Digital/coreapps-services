import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import financeRoutes from './routes/finance.routes.js';
import { applySecurityMiddleware } from '../../shared/middleware/security.middleware.js';

dotenv.config({ path: '../../../.env' });

const app = express();
const PORT = 3003;

// Security: Helmet, CORS whitelist, XSS sanitization, input sanitization, HPP
applySecurityMiddleware(app);
app.use(morgan('combined'));

// Finance Routes
app.use('/', financeRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'finance-service', timestamp: new Date() });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Finance Service running on port ${PORT}`);
  });
}

export default app;
