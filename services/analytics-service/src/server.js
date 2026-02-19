import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import analyticsRoutes from './routes/analytics.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import dashboardRoutes from './routes/dashboardCustomization.routes.js';
import { applySecurityMiddleware } from '../../../shared/middleware/security.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.ANALYTICS_PORT || 3010;

// Security: Helmet, CORS whitelist, XSS sanitization, input sanitization, HPP
applySecurityMiddleware(app);
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'analytics-service' });
});

// Routes
app.use('/', analyticsRoutes);
app.use('/reports', reportsRoutes);
app.use('/dashboard', dashboardRoutes);

app.listen(PORT, () => {
    console.log(`Analytics Service running on port ${PORT}`);
});
