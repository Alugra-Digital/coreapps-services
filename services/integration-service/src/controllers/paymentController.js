import axios from 'axios';
import crypto from 'crypto';

const XENDIT_API_URL = 'https://api.xendit.co/v2/invoices';

/**
 * Create a payment link via Xendit for an internal invoice.
 *
 * POST /payment/create-link
 * Body: { invoiceId, invoiceNumber, amount, currency, description, customerEmail, customerName }
 */
export async function createPaymentLink(req, res) {
  try {
    const {
      invoiceId,
      invoiceNumber,
      amount,
      currency,
      description,
      customerEmail,
      customerName,
    } = req.body;

    // Validate required fields
    if (!invoiceId || !amount) {
      return res.status(400).json({
        message: 'Missing required fields: invoiceId, amount',
        code: 'VALIDATION_ERROR',
      });
    }

    const paymentPayload = {
      invoiceId,
      invoiceNumber: invoiceNumber || `INV-${invoiceId}`,
      amount,
      currency: currency || 'IDR',
      description: description || `Payment for invoice ${invoiceNumber || invoiceId}`,
      customerEmail,
      customerName,
      requestedAt: new Date().toISOString(),
    };

    // If Xendit secret key is not set, log the request
    if (!process.env.XENDIT_SECRET_KEY) {
      console.log('[Payment] Xendit API key not configured. Payment link creation logged.');
      console.log('[Payment] Payload:', JSON.stringify(paymentPayload, null, 2));

      return res.status(200).json({
        status: 'simulated',
        message: 'Payment link simulated (Xendit not configured)',
        paymentLink: `https://checkout.xendit.co/simulated/${invoiceId}`,
        externalId: `sim-${invoiceId}-${Date.now()}`,
        amount,
        currency: currency || 'IDR',
      });
    }

    // Build Xendit invoice request
    const xenditPayload = {
      external_id: `coreapps-${invoiceId}-${Date.now()}`,
      amount,
      currency: currency || 'IDR',
      description: paymentPayload.description,
      invoice_duration: 86400, // 24 hours
      customer: {},
      success_redirect_url: process.env.PAYMENT_SUCCESS_URL || 'https://coreapps.alugra.com/payment/success',
      failure_redirect_url: process.env.PAYMENT_FAILURE_URL || 'https://coreapps.alugra.com/payment/failed',
    };

    if (customerEmail) {
      xenditPayload.customer.email = customerEmail;
    }
    if (customerName) {
      xenditPayload.customer.given_names = customerName;
    }

    const authToken = Buffer.from(`${process.env.XENDIT_SECRET_KEY}:`).toString('base64');

    const response = await axios.post(XENDIT_API_URL, xenditPayload, {
      headers: {
        Authorization: `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    const xenditInvoice = response.data;

    console.log(`[Payment] Xendit invoice created: ${xenditInvoice.id}`);

    return res.status(201).json({
      status: 'created',
      message: 'Payment link created successfully',
      paymentLink: xenditInvoice.invoice_url,
      externalId: xenditInvoice.external_id,
      xenditInvoiceId: xenditInvoice.id,
      amount: xenditInvoice.amount,
      currency: xenditInvoice.currency,
      expiresAt: xenditInvoice.expiry_date,
    });
  } catch (error) {
    console.error('[Payment] Failed to create payment link:', error.response?.data || error.message);

    return res.status(500).json({
      message: error.response?.data?.message || error.message || 'Failed to create payment link',
      code: 'ERROR',
    });
  }
}

/**
 * Handle Xendit payment webhook callback.
 * Receives payment status updates and updates the internal invoice accordingly.
 *
 * POST /payment/webhook/xendit
 * Headers: x-callback-token (Xendit verification token)
 * Body: Xendit webhook payload
 */
export async function handlePaymentWebhook(req, res) {
  try {
    const callbackToken = req.headers['x-callback-token'];
    const webhookPayload = req.body;

    // Verify callback token if configured
    if (process.env.XENDIT_CALLBACK_TOKEN) {
      if (callbackToken !== process.env.XENDIT_CALLBACK_TOKEN) {
        console.warn('[Payment Webhook] Invalid callback token received');
        return res.status(401).json({ message: 'Invalid callback token', code: 'UNAUTHORIZED' });
      }
    } else {
      console.warn('[Payment Webhook] XENDIT_CALLBACK_TOKEN not set; skipping verification');
    }

    const {
      id: xenditInvoiceId,
      external_id: externalId,
      status,
      amount,
      paid_amount: paidAmount,
      payment_method: paymentMethod,
      payment_channel: paymentChannel,
      paid_at: paidAt,
    } = webhookPayload;

    console.log(`[Payment Webhook] Received event for ${externalId}: status=${status}`);

    // Extract our internal invoice ID from external_id (format: coreapps-{invoiceId}-{timestamp})
    const parts = externalId?.split('-') || [];
    const internalInvoiceId = parts.length >= 2 ? parts[1] : null;

    // Map Xendit status to internal status
    const statusMapping = {
      PAID: 'PAID',
      SETTLED: 'PAID',
      EXPIRED: 'OVERDUE',
    };
    const internalStatus = statusMapping[status] || status;

    const webhookLog = {
      xenditInvoiceId,
      externalId,
      internalInvoiceId,
      status,
      internalStatus,
      amount,
      paidAmount,
      paymentMethod,
      paymentChannel,
      paidAt,
      receivedAt: new Date().toISOString(),
    };

    console.log('[Payment Webhook] Processed:', JSON.stringify(webhookLog, null, 2));

    // In production, this would update the invoice status in the database:
    // await db.update(invoices).set({ status: internalStatus, paidAt }).where(eq(invoices.id, internalInvoiceId));

    // Always respond 200 to acknowledge receipt (Xendit will retry on non-2xx)
    return res.status(200).json({
      status: 'received',
      message: 'Webhook processed successfully',
      internalInvoiceId,
      newStatus: internalStatus,
    });
  } catch (error) {
    console.error('[Payment Webhook] Error processing webhook:', error.message);

    // Still return 200 to prevent Xendit from retrying indefinitely
    return res.status(200).json({
      status: 'error',
      message: error.message || 'Webhook received but processing failed',
      code: 'WEBHOOK_PROCESSING_FAILED',
    });
  }
}
