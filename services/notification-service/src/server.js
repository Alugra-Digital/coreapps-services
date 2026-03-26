import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import morgan from 'morgan';
import { morganStream } from '../../shared/utils/logger.js';
import dotenv from 'dotenv';
import { verifyToken } from '../../shared/utils/jwt.util.js';
import { NotificationService } from './services/notificationService.js';
import { startEmailProcessor } from './services/emailProcessor.js';
import { authenticate } from './middleware/auth.middleware.js';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from './controllers/notificationController.js';
import { applySecurityMiddleware } from '../../shared/middleware/security.middleware.js';

dotenv.config({ path: '../../.env' });

const app = express();
const httpServer = createServer(app);

// Socket.IO CORS: use same whitelist as REST API
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',').map((o) => o.trim()).filter(Boolean);

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    }
});

const PORT = 3011;

// Security: Helmet, CORS whitelist, XSS sanitization, input sanitization, HPP
applySecurityMiddleware(app);
app.use(morgan('combined', { stream: morganStream }));

const notificationService = new NotificationService(io);

// REST API - fetch user notifications (path is /notifications when proxied from gateway)
app.get('/notifications', authenticate, getNotifications);
app.patch('/notifications/read-all', authenticate, markAllNotificationsRead);
app.patch('/notifications/:id/read', authenticate, markNotificationRead);

// Auth middleware for Socket.IO
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    try {
        const payload = await verifyToken(token);
        socket.userId = payload.id;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    socket.join(`user_${socket.userId}`);

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
    });
});

// Internal API for other services
app.post('/api/notification/internal/handle-mentions', async (req, res) => {
    const secret = req.headers['internal-secret'];
    if (secret !== process.env.INTERNAL_SERVICE_SECRET) {
        return res.status(401).json({ message: 'Unauthorized internal request', code: 'UNAUTHORIZED' });
    }

    try {
        const { content, authorId, documentType, documentId } = req.body;
        await notificationService.handleMentions(content, authorId, documentType, documentId);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ message: err.message, code: 'ERROR' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'notification-service', timestamp: new Date() });
});

httpServer.listen(PORT, () => {
    console.log(`Notification Service running on port ${PORT}`);
    startEmailProcessor(); // Start background worker
});
