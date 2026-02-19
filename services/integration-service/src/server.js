import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import integrationRoutes from './routes/integration.routes.js';

dotenv.config({ path: '../../../.env' });

const app = express();
const PORT = process.env.INTEGRATION_SERVICE_PORT || 3014;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'integration-service',
    timestamp: new Date(),
    integrations: {
      email: !!process.env.SENDGRID_API_KEY,
      payment: !!process.env.XENDIT_SECRET_KEY,
    },
  });
});

// Routes
app.use('/', integrationRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Integration Service] Error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    code: 'ERROR',
    service: 'integration-service',
  });
});

app.listen(PORT, () => {
  console.log(`Integration Service running on port ${PORT}`);
  console.log(`  Email integration: ${process.env.SENDGRID_API_KEY ? 'ENABLED' : 'DISABLED (no SENDGRID_API_KEY)'}`);
  console.log(`  Payment integration: ${process.env.XENDIT_SECRET_KEY ? 'ENABLED' : 'DISABLED (no XENDIT_SECRET_KEY)'}`);
});
