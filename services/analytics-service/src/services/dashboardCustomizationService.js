import { db } from '../../../shared/db/index.js';
import { 
  dashboardWidgets, 
  dashboardLayouts, 
  customKpis 
} from '../../../shared/db/schema.js';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Create a new dashboard widget
 */
export async function createWidget(data) {
  const [widget] = await db.insert(dashboardWidgets)
    .values({
      userId: data.userId,
      type: data.type,
      title: data.title,
      config: data.config,
      dataSource: data.dataSource,
      refreshInterval: data.refreshInterval,
    })
    .returning();

  return widget;
}

/**
 * Get all widgets for a user
 */
export async function getWidgets(userId) {
  const widgets = await db.select()
    .from(dashboardWidgets)
    .where(eq(dashboardWidgets.userId, userId))
    .orderBy(desc(dashboardWidgets.createdAt));

  return widgets;
}

/**
 * Update a widget
 */
export async function updateWidget(id, userId, data) {
  const [updated] = await db.update(dashboardWidgets)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(
      eq(dashboardWidgets.id, id),
      eq(dashboardWidgets.userId, userId)
    ))
    .returning();

  return updated || null;
}

/**
 * Delete a widget
 */
export async function deleteWidget(id, userId) {
  const result = await db.delete(dashboardWidgets)
    .where(and(
      eq(dashboardWidgets.id, id),
      eq(dashboardWidgets.userId, userId)
    ));

  return result.rowCount > 0;
}

/**
 * Save dashboard layout for a user
 */
export async function saveLayout(userId, layout) {
  // Check if layout already exists
  const [existing] = await db.select()
    .from(dashboardLayouts)
    .where(eq(dashboardLayouts.userId, userId))
    .limit(1);

  if (existing) {
    // Update existing layout
    const [updated] = await db.update(dashboardLayouts)
      .set({
        layout,
        updatedAt: new Date(),
      })
      .where(eq(dashboardLayouts.userId, userId))
      .returning();

    return updated;
  } else {
    // Create new layout
    const [created] = await db.insert(dashboardLayouts)
      .values({
        userId,
        layout,
      })
      .returning();

    return created;
  }
}

/**
 * Get dashboard layout for a user
 */
export async function getLayout(userId) {
  const [layout] = await db.select()
    .from(dashboardLayouts)
    .where(eq(dashboardLayouts.userId, userId))
    .limit(1);

  return layout || null;
}

/**
 * Create a custom KPI
 */
export async function createKpi(data) {
  const [kpi] = await db.insert(customKpis)
    .values({
      name: data.name,
      description: data.description,
      formula: data.formula,
      dataSource: data.dataSource,
      threshold: data.threshold,
      createdBy: data.createdBy,
    })
    .returning();

  return kpi;
}

/**
 * Get all custom KPIs
 */
export async function getKpis() {
  const kpis = await db.select()
    .from(customKpis)
    .orderBy(desc(customKpis.createdAt));

  return kpis;
}

/**
 * Update a KPI
 */
export async function updateKpi(id, data) {
  const [updated] = await db.update(customKpis)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(customKpis.id, id))
    .returning();

  return updated || null;
}

/**
 * Delete a KPI
 */
export async function deleteKpi(id) {
  const result = await db.delete(customKpis)
    .where(eq(customKpis.id, id));

  return result.rowCount > 0;
}
