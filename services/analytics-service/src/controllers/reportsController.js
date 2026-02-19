import * as reportsService from '../services/reportsService.js';
import { z } from 'zod';

// Validation schemas
const reportTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['financial', 'inventory', 'hr', 'sales', 'custom']),
  query: z.object({}).passthrough(), // JSONB query definition
  filters: z.object({}).passthrough().optional(),
  columns: z.array(z.object({
    name: z.string(),
    label: z.string(),
    type: z.string().optional(),
  })),
});

const reportScheduleSchema = z.object({
  templateId: z.number().int().positive(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  recipients: z.array(z.string().email()),
  nextRun: z.string().datetime(),
});

const generateReportSchema = z.object({
  templateId: z.number().int().positive(),
  filters: z.object({}).passthrough().optional(),
});

/**
 * Create a new report template
 * POST /reports/templates
 */
export async function createTemplate(req, res) {
  try {
    const data = reportTemplateSchema.parse(req.body);
    const userId = req.user?.id;

    const template = await reportsService.createTemplate({
      ...data,
      createdBy: userId,
    });

    res.status(201).json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.errors?.map((e) => ({ field: e.path?.join?.('.') ?? '', message: e.message })) ?? [] });
    }
    console.error('Error creating report template:', error);
    res.status(500).json({ message: 'Failed to create report template', code: 'ERROR' });
  }
}

/**
 * Get all report templates
 * GET /reports/templates
 */
export async function getTemplates(req, res) {
  try {
    const { page = 1, limit = 10, type } = req.query;
    
    const templates = await reportsService.getTemplates({
      page: parseInt(page),
      limit: parseInt(limit),
      type,
    });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching report templates:', error);
    res.status(500).json({ message: 'Failed to fetch report templates', code: 'ERROR' });
  }
}

/**
 * Get a single report template by ID
 * GET /reports/templates/:id
 */
export async function getTemplateById(req, res) {
  try {
    const { id } = req.params;
    const template = await reportsService.getTemplateById(parseInt(id));

    if (!template) {
      return res.status(404).json({ message: 'Report template not found', code: 'NOT_FOUND' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching report template:', error);
    res.status(500).json({ message: 'Failed to fetch report template', code: 'ERROR' });
  }
}

/**
 * Update a report template
 * PUT /reports/templates/:id
 */
export async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    const data = reportTemplateSchema.partial().parse(req.body);

    const template = await reportsService.updateTemplate(parseInt(id), data);

    if (!template) {
      return res.status(404).json({ message: 'Report template not found', code: 'NOT_FOUND' });
    }

    res.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.errors?.map((e) => ({ field: e.path?.join?.('.') ?? '', message: e.message })) ?? [] });
    }
    console.error('Error updating report template:', error);
    res.status(500).json({ message: 'Failed to update report template', code: 'ERROR' });
  }
}

/**
 * Delete a report template
 * DELETE /reports/templates/:id
 */
export async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;
    const success = await reportsService.deleteTemplate(parseInt(id));

    if (!success) {
      return res.status(404).json({ message: 'Report template not found', code: 'NOT_FOUND' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting report template:', error);
    res.status(500).json({ message: 'Failed to delete report template', code: 'ERROR' });
  }
}

/**
 * Generate a report from a template
 * POST /reports/generate
 */
export async function generateReport(req, res) {
  try {
    const data = generateReportSchema.parse(req.body);
    const userId = req.user?.id;

    const report = await reportsService.generateReport({
      templateId: data.templateId,
      filters: data.filters,
      generatedBy: userId,
    });

    res.status(201).json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.errors?.map((e) => ({ field: e.path?.join?.('.') ?? '', message: e.message })) ?? [] });
    }
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Failed to generate report', code: 'ERROR' });
  }
}

/**
 * Get a generated report by ID
 * GET /reports/:id
 */
export async function getReport(req, res) {
  try {
    const { id } = req.params;
    const report = await reportsService.getReportById(parseInt(id));

    if (!report) {
      return res.status(404).json({ message: 'Report not found', code: 'NOT_FOUND' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Failed to fetch report', code: 'ERROR' });
  }
}

/**
 * Schedule a report
 * POST /reports/schedule
 */
export async function createSchedule(req, res) {
  try {
    const data = reportScheduleSchema.parse(req.body);

    const schedule = await reportsService.createSchedule(data);

    res.status(201).json(schedule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.errors?.map((e) => ({ field: e.path?.join?.('.') ?? '', message: e.message })) ?? [] });
    }
    console.error('Error creating report schedule:', error);
    res.status(500).json({ message: 'Failed to create report schedule', code: 'ERROR' });
  }
}

/**
 * Get all report schedules
 * GET /reports/schedules
 */
export async function getSchedules(req, res) {
  try {
    const schedules = await reportsService.getSchedules();
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching report schedules:', error);
    res.status(500).json({ message: 'Failed to fetch report schedules', code: 'ERROR' });
  }
}

/**
 * Delete a report schedule
 * DELETE /reports/schedules/:id
 */
export async function deleteSchedule(req, res) {
  try {
    const { id } = req.params;
    const success = await reportsService.deleteSchedule(parseInt(id));

    if (!success) {
      return res.status(404).json({ message: 'Report schedule not found', code: 'NOT_FOUND' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting report schedule:', error);
    res.status(500).json({ message: 'Failed to delete report schedule', code: 'ERROR' });
  }
}

/**
 * Export a report (PDF, Excel, CSV)
 * GET /reports/export/:id?format=pdf
 */
export async function exportReport(req, res) {
  try {
    const { id } = req.params;
    const { format = 'pdf' } = req.query;

    if (!['pdf', 'excel', 'csv'].includes(format)) {
      return res.status(400).json({ message: 'Invalid export format', code: 'VALIDATION_ERROR' });
    }

    const result = await reportsService.exportReport(parseInt(id), format);

    if (!result) {
      return res.status(404).json({ message: 'Report not found', code: 'NOT_FOUND' });
    }

    // Set appropriate headers based on format
    const contentTypes = {
      pdf: 'application/pdf',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
    };

    res.setHeader('Content-Type', contentTypes[format]);
    res.setHeader('Content-Disposition', `attachment; filename="report-${id}.${format}"`);
    
    // For now, return the file URL
    // In production, this would stream the actual file
    res.json({ url: result.fileUrl });
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ message: 'Failed to export report', code: 'ERROR' });
  }
}
