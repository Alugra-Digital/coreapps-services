import express from 'express';
import morgan from 'morgan';
import { morganStream } from '../../shared/utils/logger.js';
import dotenv from 'dotenv';
import assetRoutes from './routes/asset.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import { applySecurityMiddleware } from '../../shared/middleware/security.middleware.js';

dotenv.config({ path: '../../../.env' });

const app = express();
const PORT = 3013;

// Security: Helmet, CORS whitelist, XSS sanitization, input sanitization, HPP
applySecurityMiddleware(app);
app.use(morgan('combined', { stream: morganStream }));

app.use('/', assetRoutes);
app.use('/maintenance', maintenanceRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'asset-service', timestamp: new Date() });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Asset Service running on port ${PORT}`);
  });
}

export default app;
