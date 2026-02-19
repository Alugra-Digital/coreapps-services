import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import inventoryRoutes from './routes/inventory.routes.js';
import { applySecurityMiddleware } from '../../../shared/middleware/security.middleware.js';

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = 3005;

// Security: Helmet, CORS whitelist, XSS sanitization, input sanitization, HPP
applySecurityMiddleware(app);
app.use(morgan('combined'));

// Inventory Routes
app.use('/', inventoryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'inventory-service', timestamp: new Date() });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Inventory Service running on port ${PORT}`);
  });
}

export default app;
