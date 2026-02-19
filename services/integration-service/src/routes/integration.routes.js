import express from 'express';
import { sendEmail } from '../controllers/emailController.js';
import { createPaymentLink, handlePaymentWebhook } from '../controllers/paymentController.js';

const router = express.Router();

// ==================== EMAIL INTEGRATION ====================

/**
 * @openapi
 * /email/send:
 *   post:
 *     tags: [Integration]
 *     summary: Send an email via SendGrid
 *     description: Sends an email using the SendGrid API. Queues the email if the API key is not configured.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [to, subject, body]
 *             properties:
 *               to:
 *                 type: string
 *                 description: Recipient email address
 *                 example: client@example.com
 *               subject:
 *                 type: string
 *                 example: Invoice #INV-2026-001 from CoreApps
 *               body:
 *                 type: string
 *                 description: HTML email body
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     content:
 *                       type: string
 *                       description: Base64-encoded file content
 *                     filename:
 *                       type: string
 *                     type:
 *                       type: string
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       202:
 *         description: Email queued for later delivery
 *       400:
 *         description: Missing required fields
 */
router.post('/email/send', sendEmail);

// ==================== PAYMENT INTEGRATION ====================

/**
 * @openapi
 * /payment/create-link:
 *   post:
 *     tags: [Integration]
 *     summary: Create a Xendit payment link for an invoice
 *     description: Creates a Xendit invoice/payment link for an internal CoreApps invoice.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoiceId, amount]
 *             properties:
 *               invoiceId:
 *                 type: integer
 *                 description: Internal invoice ID
 *               invoiceNumber:
 *                 type: string
 *                 example: INV-2026-001
 *               amount:
 *                 type: number
 *                 example: 15000000
 *               currency:
 *                 type: string
 *                 default: IDR
 *               description:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *               customerName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment link created
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Xendit API error
 */
router.post('/payment/create-link', createPaymentLink);

/**
 * @openapi
 * /payment/webhook/xendit:
 *   post:
 *     tags: [Integration]
 *     summary: Xendit payment webhook callback
 *     description: >
 *       Receives payment status updates from Xendit.
 *       Verifies the callback token and updates the internal invoice status.
 *       Always returns 200 to prevent Xendit retries.
 *     parameters:
 *       - in: header
 *         name: x-callback-token
 *         schema:
 *           type: string
 *         description: Xendit verification token
 *     responses:
 *       200:
 *         description: Webhook acknowledged
 *       401:
 *         description: Invalid callback token
 */
router.post('/payment/webhook/xendit', handlePaymentWebhook);

export default router;
