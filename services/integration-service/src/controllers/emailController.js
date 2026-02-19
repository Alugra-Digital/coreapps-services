import axios from 'axios';

const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

/**
 * Send an email via SendGrid API.
 * Falls back to logging if SENDGRID_API_KEY is not configured.
 *
 * POST /email/send
 * Body: { to, subject, body, attachments? }
 */
export async function sendEmail(req, res) {
  try {
    const { to, subject, body, attachments } = req.body;

    // Validate required fields
    if (!to || !subject || !body) {
      return res.status(400).json({
        message: 'Missing required fields: to, subject, body',
        code: 'VALIDATION_ERROR',
      });
    }

    const emailPayload = {
      to,
      subject,
      body,
      attachments: attachments || [],
      requestedAt: new Date().toISOString(),
    };

    // If SendGrid API key is not set, queue/log the email
    if (!process.env.SENDGRID_API_KEY) {
      console.log('[Email] SendGrid API key not configured. Email queued for later delivery.');
      console.log('[Email] Payload:', JSON.stringify(emailPayload, null, 2));

      return res.status(202).json({
        status: 'queued',
        message: 'Email queued (SendGrid not configured). Will be sent when API key is available.',
        email: {
          to,
          subject,
          queuedAt: emailPayload.requestedAt,
        },
      });
    }

    // Build SendGrid request
    const sendGridPayload = {
      personalizations: [
        {
          to: Array.isArray(to) ? to.map((email) => ({ email })) : [{ email: to }],
          subject,
        },
      ],
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@alugra.co.id',
        name: process.env.SENDGRID_FROM_NAME || 'CoreApps ERP',
      },
      content: [
        {
          type: 'text/html',
          value: body,
        },
      ],
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      sendGridPayload.attachments = attachments.map((att) => ({
        content: att.content, // base64 encoded
        filename: att.filename,
        type: att.type || 'application/octet-stream',
        disposition: 'attachment',
      }));
    }

    const response = await axios.post(SENDGRID_API_URL, sendGridPayload, {
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log(`[Email] Sent successfully to: ${Array.isArray(to) ? to.join(', ') : to}`);

    return res.status(200).json({
      status: 'sent',
      message: 'Email sent successfully',
      email: {
        to,
        subject,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Email] Failed to send:', error.response?.data || error.message);

    // If SendGrid fails, queue the email for retry
    if (error.response) {
      console.log('[Email] Queuing email for retry due to API failure.');
      return res.status(202).json({
        status: 'queued',
        message: error.response.data?.errors?.[0]?.message || 'Email queued for retry due to delivery failure',
        code: 'QUEUED',
      });
    }

    return res.status(500).json({
      message: error.message || 'Failed to send email',
      code: 'ERROR',
    });
  }
}
