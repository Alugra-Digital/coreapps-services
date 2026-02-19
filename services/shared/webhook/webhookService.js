import crypto from 'crypto';
import { db } from '../db/index.js';

// Webhook events
export const WEBHOOK_EVENTS = {
  INVOICE_CREATED: 'invoice.created',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_OVERDUE: 'invoice.overdue',
  EMPLOYEE_CREATED: 'employee.created',
  EMPLOYEE_UPDATED: 'employee.updated',
  EMPLOYEE_TERMINATED: 'employee.terminated',
  LEAD_CREATED: 'lead.created',
  LEAD_CONVERTED: 'lead.converted',
  OPPORTUNITY_WON: 'opportunity.won',
  OPPORTUNITY_LOST: 'opportunity.lost',
  WORK_ORDER_CREATED: 'work_order.created',
  WORK_ORDER_COMPLETED: 'work_order.completed',
  STOCK_LOW: 'stock.low',
  PAYMENT_RECEIVED: 'payment.received',
  LEAVE_APPLIED: 'leave.applied',
  LEAVE_APPROVED: 'leave.approved',
  PAYROLL_POSTED: 'payroll.posted',
  ASSET_CREATED: 'asset.created',
};

/**
 * Trigger webhooks for a given event.
 *
 * In production, this would:
 * 1. Query registered webhook URLs for this event from the database
 * 2. Send POST request to each URL with payload
 * 3. Generate HMAC signature for verification
 * 4. Queue failed deliveries for retry with exponential backoff
 *
 * @param {string} event - One of WEBHOOK_EVENTS
 * @param {object} payload - Event-specific data
 * @returns {Promise<object>} Webhook log entry
 */
export async function triggerWebhooks(event, payload) {
  console.log(`[Webhook] Triggering event: ${event}`);

  const webhookLog = {
    event,
    payload: JSON.stringify(payload),
    timestamp: new Date().toISOString(),
    deliveries: [],
  };

  try {
    // In production: query registered webhook subscriptions
    // const subscriptions = await db.select().from(webhookSubscriptions)
    //   .where(eq(webhookSubscriptions.event, event))
    //   .where(eq(webhookSubscriptions.active, true));

    // For now, log the event
    console.log('[Webhook] Event triggered:', JSON.stringify(webhookLog, null, 2));

    // In production: fan out to each subscriber
    // for (const sub of subscriptions) {
    //   try {
    //     const sig = generateWebhookSignature(payload, sub.secret);
    //     const response = await axios.post(sub.url, payload, {
    //       headers: {
    //         'Content-Type': 'application/json',
    //         'X-Webhook-Event': event,
    //         'X-Webhook-Signature': sig,
    //         'X-Webhook-Timestamp': webhookLog.timestamp,
    //       },
    //       timeout: 10000,
    //     });
    //     webhookLog.deliveries.push({ url: sub.url, status: response.status, success: true });
    //   } catch (err) {
    //     webhookLog.deliveries.push({ url: sub.url, error: err.message, success: false });
    //     // Queue for retry with exponential backoff
    //   }
    // }
  } catch (err) {
    console.error('[Webhook] Error triggering webhooks:', err.message);
    webhookLog.error = err.message;
  }

  return webhookLog;
}

/**
 * Generate HMAC-SHA256 signature for webhook payload verification.
 *
 * @param {object|string} payload - The webhook payload to sign
 * @param {string} secret - The shared secret for HMAC generation
 * @returns {string} Hex-encoded HMAC signature
 */
export function generateWebhookSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(typeof payload === 'string' ? payload : JSON.stringify(payload));
  return hmac.digest('hex');
}

/**
 * Verify a webhook signature against expected value.
 *
 * @param {object|string} payload - The webhook payload that was signed
 * @param {string} signature - The received signature to verify
 * @param {string} secret - The shared secret used for signing
 * @returns {boolean} Whether the signature is valid
 */
export function verifyWebhookSignature(payload, signature, secret) {
  const expected = generateWebhookSignature(payload, secret);
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
}
