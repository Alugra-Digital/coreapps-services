import express from 'express';

const router = express.Router();

/**
 * @openapi
 * /batch:
 *   post:
 *     summary: Execute multiple API requests in a single call
 *     tags: [Batch]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requests
 *             properties:
 *               requests:
 *                 type: array
 *                 maxItems: 50
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - method
 *                     - path
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Unique identifier for this request
 *                     method:
 *                       type: string
 *                       enum: [GET, POST, PUT, DELETE, PATCH]
 *                     path:
 *                       type: string
 *                       description: API path (e.g., /api/hr/employees)
 *                     body:
 *                       type: object
 *                       description: Request body for POST/PUT/PATCH
 *                     headers:
 *                       type: object
 *                       description: Additional headers
 *     responses:
 *       200:
 *         description: Batch response with individual results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       status:
 *                         type: integer
 *                       data:
 *                         type: object
 *                       error:
 *                         type: string
 *       400:
 *         description: Invalid batch request
 */
router.post('/batch', async (req, res) => {
  const { requests } = req.body;
  
  if (!Array.isArray(requests)) {
    return res.status(400).json({ 
      message: 'Requests must be an array',
      code: 'INVALID_BATCH_REQUEST'
    });
  }
  
  if (requests.length === 0) {
    return res.status(400).json({ 
      message: 'Requests array cannot be empty',
      code: 'EMPTY_BATCH_REQUEST'
    });
  }
  
  if (requests.length > 50) {
    return res.status(400).json({ 
      message: 'Maximum 50 requests allowed per batch',
      code: 'BATCH_SIZE_EXCEEDED'
    });
  }
  
  const results = await Promise.allSettled(
    requests.map(async ({ id, method, path, body, headers }) => {
      try {
        const gatewayUrl = `http://localhost:${process.env.GATEWAY_PORT || 3000}`;
        const response = await fetch(`${gatewayUrl}${path}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
            Authorization: req.headers.authorization
          },
          body: body ? JSON.stringify(body) : undefined
        });
        
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
        
        return {
          id,
          status: response.status,
          data
        };
      } catch (error) {
        return {
          id,
          status: 500,
          message: error.message,
          code: 'ERROR'
        };
      }
    })
  );
  
  res.json({
    success: true,
    results: results.map(r => r.status === 'fulfilled' ? r.value : {
      id: r.reason?.id || 'unknown',
      status: 500,
      message: r.reason?.message || 'Unknown error',
      code: 'ERROR'
    })
  });
});

export default router;
