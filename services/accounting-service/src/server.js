import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import accountingRoutes from './routes/accounting.routes.js';
import workflowRoutes from './routes/workflow.routes.js';
import definitionsRoutes from './routes/definitions.routes.js';
import commentRoutes from './routes/comment.routes.js';
import { applySecurityMiddleware } from '../../shared/middleware/security.middleware.js';

dotenv.config({ path: '../../../.env' });

const app = express();
const PORT = 3006;

// Security: Helmet, CORS whitelist, XSS sanitization, input sanitization, HPP
applySecurityMiddleware(app);
app.use(morgan('combined'));

// Accounting Routes
app.use('/', accountingRoutes);

// Workflow Definitions - accessible at /api/accounting/definitions
app.use('/definitions', definitionsRoutes);

// Workflow Routes - instances, timeline at /api/accounting/workflow
app.use('/workflow', workflowRoutes);

// Comment Routes - accessible at /api/accounting/comments
app.use('/comments', commentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'accounting-service', timestamp: new Date() });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Accounting Service running on port ${PORT}`);
  });
}

export default app;
