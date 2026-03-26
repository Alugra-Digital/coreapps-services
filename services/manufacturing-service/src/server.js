import express from 'express';
import morgan from 'morgan';
import { morganStream } from '../../shared/utils/logger.js';
import dotenv from 'dotenv';
import bomRoutes from './routes/bom.routes.js';
import workOrderRoutes from './routes/workOrder.routes.js';
import qualityRoutes from './routes/quality.routes.js';
import { applySecurityMiddleware } from '../../shared/middleware/security.middleware.js';

dotenv.config({ path: '../../../.env' });

const app = express();
const PORT = 3012;

// Security: Helmet, CORS whitelist, XSS sanitization, input sanitization, HPP
applySecurityMiddleware(app);
app.use(morgan('combined', { stream: morganStream }));

app.use('/', bomRoutes);
app.use('/', workOrderRoutes);
app.use('/', qualityRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'manufacturing-service', timestamp: new Date() });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Manufacturing Service running on port ${PORT}`);
  });
}

export default app;
