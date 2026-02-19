import * as dashboardService from '../services/dashboardCustomizationService.js';
import { z } from 'zod';

// Validation schemas
const widgetSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  config: z.object({}).passthrough(),
  dataSource: z.string().min(1),
  refreshInterval: z.number().int().positive().optional(),
});

const layoutSchema = z.object({
  layout: z.array(z.object({
    i: z.string(),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  })),
});

const kpiSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  formula: z.string().min(1),
  dataSource: z.object({}).passthrough(),
  threshold: z.object({
    warning: z.number().optional(),
    danger: z.number().optional(),
  }).optional(),
});

/**
 * Create a new dashboard widget
 * POST /dashboard/widgets
 */
export async function createWidget(req, res) {
  try {
    const data = widgetSchema.parse(req.body);
    const userId = req.user?.id;

    const widget = await dashboardService.createWidget({
      ...data,
      userId,
    });

    res.status(201).json(widget);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.errors?.map((e) => ({ field: e.path?.join?.('.') ?? '', message: e.message })) ?? [] });
    }
    console.error('Error creating widget:', error);
    res.status(500).json({ message: 'Failed to create widget', code: 'ERROR' });
  }
}

/**
 * Get all widgets for the current user
 * GET /dashboard/widgets
 */
export async function getWidgets(req, res) {
  try {
    const userId = req.user?.id;
    const widgets = await dashboardService.getWidgets(userId);
    res.json(widgets);
  } catch (error) {
    console.error('Error fetching widgets:', error);
    res.status(500).json({ message: 'Failed to fetch widgets', code: 'ERROR' });
  }
}

/**
 * Update a widget
 * PUT /dashboard/widgets/:id
 */
export async function updateWidget(req, res) {
  try {
    const { id } = req.params;
    const data = widgetSchema.partial().parse(req.body);
    const userId = req.user?.id;

    const widget = await dashboardService.updateWidget(parseInt(id), userId, data);

    if (!widget) {
      return res.status(404).json({ message: 'Widget not found', code: 'NOT_FOUND' });
    }

    res.json(widget);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.errors?.map((e) => ({ field: e.path?.join?.('.') ?? '', message: e.message })) ?? [] });
    }
    console.error('Error updating widget:', error);
    res.status(500).json({ message: 'Failed to update widget', code: 'ERROR' });
  }
}

/**
 * Delete a widget
 * DELETE /dashboard/widgets/:id
 */
export async function deleteWidget(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const success = await dashboardService.deleteWidget(parseInt(id), userId);

    if (!success) {
      return res.status(404).json({ message: 'Widget not found', code: 'NOT_FOUND' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting widget:', error);
    res.status(500).json({ message: 'Failed to delete widget', code: 'ERROR' });
  }
}

/**
 * Save dashboard layout
 * PUT /dashboard/layout
 */
export async function saveLayout(req, res) {
  try {
    const data = layoutSchema.parse(req.body);
    const userId = req.user?.id;

    const layout = await dashboardService.saveLayout(userId, data.layout);

    res.json(layout);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.errors?.map((e) => ({ field: e.path?.join?.('.') ?? '', message: e.message })) ?? [] });
    }
    console.error('Error saving layout:', error);
    res.status(500).json({ message: 'Failed to save layout', code: 'ERROR' });
  }
}

/**
 * Get dashboard layout for current user
 * GET /dashboard/layout
 */
export async function getLayout(req, res) {
  try {
    const userId = req.user?.id;
    const layout = await dashboardService.getLayout(userId);
    
    if (!layout) {
      return res.status(404).json({ message: 'Layout not found', code: 'NOT_FOUND' });
    }

    res.json(layout);
  } catch (error) {
    console.error('Error fetching layout:', error);
    res.status(500).json({ message: 'Failed to fetch layout', code: 'ERROR' });
  }
}

/**
 * Create a custom KPI
 * POST /dashboard/kpis
 */
export async function createKpi(req, res) {
  try {
    const data = kpiSchema.parse(req.body);
    const userId = req.user?.id;

    const kpi = await dashboardService.createKpi({
      ...data,
      createdBy: userId,
    });

    res.status(201).json(kpi);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.errors?.map((e) => ({ field: e.path?.join?.('.') ?? '', message: e.message })) ?? [] });
    }
    console.error('Error creating KPI:', error);
    res.status(500).json({ message: 'Failed to create KPI', code: 'ERROR' });
  }
}

/**
 * Get all KPIs
 * GET /dashboard/kpis
 */
export async function getKpis(req, res) {
  try {
    const kpis = await dashboardService.getKpis();
    res.json(kpis);
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ message: 'Failed to fetch KPIs', code: 'ERROR' });
  }
}

/**
 * Update a KPI
 * PUT /dashboard/kpis/:id
 */
export async function updateKpi(req, res) {
  try {
    const { id } = req.params;
    const data = kpiSchema.partial().parse(req.body);

    const kpi = await dashboardService.updateKpi(parseInt(id), data);

    if (!kpi) {
      return res.status(404).json({ message: 'KPI not found', code: 'NOT_FOUND' });
    }

    res.json(kpi);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.errors?.map((e) => ({ field: e.path?.join?.('.') ?? '', message: e.message })) ?? [] });
    }
    console.error('Error updating KPI:', error);
    res.status(500).json({ message: 'Failed to update KPI', code: 'ERROR' });
  }
}

/**
 * Delete a KPI
 * DELETE /dashboard/kpis/:id
 */
export async function deleteKpi(req, res) {
  try {
    const { id } = req.params;
    const success = await dashboardService.deleteKpi(parseInt(id));

    if (!success) {
      return res.status(404).json({ message: 'KPI not found', code: 'NOT_FOUND' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting KPI:', error);
    res.status(500).json({ message: 'Failed to delete KPI', code: 'ERROR' });
  }
}
