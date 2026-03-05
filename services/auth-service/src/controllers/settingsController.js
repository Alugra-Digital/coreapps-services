import { db } from '../../../shared/db/index.js';
import { organizationSettings } from '../../../shared/db/schema.js';
import { eq } from 'drizzle-orm';

const DEFAULT_SETTINGS = {
  companyName: 'Alugra Teknologi Nusantara',
  companyEmail: 'hello@alugra.com',
  companyPhone: '+62 21 9988 7766',
  companyWebsite: 'https://alugra.com',
  timezone: 'Asia/Jakarta',
  currency: 'IDR',
  dateFormat: 'dd-mm-yyyy',
  theme: 'system',
  emailNotifications: true,
  pushNotifications: false,
  securityAlerts: true,
  twoFactorAuth: false,
  sessionTimeout: '30m',
  autoAssignApprover: true,
  dailyBackup: true,
  softDelete: true,
  compactMode: false,
  defaultApprovalFlow: 'sequential',
  escalationSla: '24h',
  retentionPeriod: '365d',
  billingEmail: 'billing@alugra.com',
  currentPlan: 'enterprise',
};

function toResponse(row) {
  if (!row) return null;
  return {
    id: row.id,
    companyName: row.companyName ?? DEFAULT_SETTINGS.companyName,
    companyEmail: row.companyEmail ?? DEFAULT_SETTINGS.companyEmail,
    companyPhone: row.companyPhone ?? DEFAULT_SETTINGS.companyPhone,
    companyWebsite: row.companyWebsite ?? DEFAULT_SETTINGS.companyWebsite,
    timezone: row.timezone ?? DEFAULT_SETTINGS.timezone,
    currency: row.currency ?? DEFAULT_SETTINGS.currency,
    dateFormat: row.dateFormat ?? DEFAULT_SETTINGS.dateFormat,
    theme: row.theme ?? DEFAULT_SETTINGS.theme,
    emailNotifications: row.emailNotifications ?? DEFAULT_SETTINGS.emailNotifications,
    pushNotifications: row.pushNotifications ?? DEFAULT_SETTINGS.pushNotifications,
    securityAlerts: row.securityAlerts ?? DEFAULT_SETTINGS.securityAlerts,
    twoFactorAuth: row.twoFactorAuth ?? DEFAULT_SETTINGS.twoFactorAuth,
    sessionTimeout: row.sessionTimeout ?? DEFAULT_SETTINGS.sessionTimeout,
    autoAssignApprover: row.autoAssignApprover ?? DEFAULT_SETTINGS.autoAssignApprover,
    dailyBackup: row.dailyBackup ?? DEFAULT_SETTINGS.dailyBackup,
    softDelete: row.softDelete ?? DEFAULT_SETTINGS.softDelete,
    compactMode: row.compactMode ?? DEFAULT_SETTINGS.compactMode,
    defaultApprovalFlow: row.defaultApprovalFlow ?? DEFAULT_SETTINGS.defaultApprovalFlow,
    escalationSla: row.escalationSla ?? DEFAULT_SETTINGS.escalationSla,
    retentionPeriod: row.retentionPeriod ?? DEFAULT_SETTINGS.retentionPeriod,
    billingEmail: row.billingEmail ?? DEFAULT_SETTINGS.billingEmail,
    currentPlan: row.currentPlan ?? DEFAULT_SETTINGS.currentPlan,
    config: row.config ?? {},
    createdAt: row.createdAt?.toISOString?.() ?? null,
    updatedAt: row.updatedAt?.toISOString?.() ?? null,
  };
}

export const getSettings = async (req, res) => {
  try {
    const [row] = await db.select().from(organizationSettings).limit(1);
    if (!row) {
      const [inserted] = await db.insert(organizationSettings).values({
        companyName: DEFAULT_SETTINGS.companyName,
        companyEmail: DEFAULT_SETTINGS.companyEmail,
        companyPhone: DEFAULT_SETTINGS.companyPhone,
        companyWebsite: DEFAULT_SETTINGS.companyWebsite,
        timezone: DEFAULT_SETTINGS.timezone,
        currency: DEFAULT_SETTINGS.currency,
        dateFormat: DEFAULT_SETTINGS.dateFormat,
        theme: DEFAULT_SETTINGS.theme,
        emailNotifications: DEFAULT_SETTINGS.emailNotifications,
        pushNotifications: DEFAULT_SETTINGS.pushNotifications,
        securityAlerts: DEFAULT_SETTINGS.securityAlerts,
        twoFactorAuth: DEFAULT_SETTINGS.twoFactorAuth,
        sessionTimeout: DEFAULT_SETTINGS.sessionTimeout,
      }).returning();
      return res.json(toResponse(inserted));
    }
    res.json(toResponse(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const body = req.body;
    const updates = { updatedAt: new Date() };
    const allowed = [
      'companyName', 'companyEmail', 'companyPhone', 'companyWebsite',
      'timezone', 'currency', 'dateFormat', 'theme',
      'emailNotifications', 'pushNotifications', 'securityAlerts', 'twoFactorAuth',
      'sessionTimeout', 'autoAssignApprover', 'dailyBackup', 'softDelete', 'compactMode',
      'defaultApprovalFlow', 'escalationSla', 'retentionPeriod', 'billingEmail', 'currentPlan',
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (Object.keys(updates).length <= 1) {
      const [row] = await db.select().from(organizationSettings).limit(1);
      return res.json(toResponse(row));
    }
    let [row] = await db.select().from(organizationSettings).limit(1);
    if (!row) {
      [row] = await db.insert(organizationSettings).values(updates).returning();
    } else {
      [row] = await db.update(organizationSettings).set(updates).where(eq(organizationSettings.id, row.id)).returning();
    }
    res.json(toResponse(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
