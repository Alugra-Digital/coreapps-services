export function toDocSchema(row) {
  if (!row) return null;
  return {
    id: `VDR-${row.id}`,
    name: row.name,
    companyName: row.companyName ?? row.name,
    address: row.address ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    npwp: row.npwp ?? null,
    pic: row.pic ?? null,
    bankName: row.bankName ?? null,
    bankAccount: row.bankAccount ?? null,
    bankBranch: row.bankBranch ?? null,
    isActive: row.isActive ?? true,
    createdAt: row.createdAt?.toISOString?.() ?? null,
    updatedAt: row.updatedAt?.toISOString?.() ?? null,
  };
}

export function fromDocSchema(body) {
  if (!body) return {};
  const m = {};
  if (body.name != null) m.name = body.name;
  if (body.companyName != null) m.companyName = body.companyName;
  if (body.address !== undefined) m.address = body.address;
  if (body.phone !== undefined) m.phone = body.phone;
  if (body.email !== undefined) m.email = body.email;
  if (body.npwp !== undefined) m.npwp = body.npwp;
  if (body.pic !== undefined) m.pic = body.pic;
  if (body.bankName !== undefined) m.bankName = body.bankName;
  if (body.bankAccount !== undefined) m.bankAccount = body.bankAccount;
  if (body.bankBranch !== undefined) m.bankBranch = body.bankBranch;
  if (body.isActive !== undefined) m.isActive = body.isActive;
  return m;
}

/** Resolve :id param - accepts "VDR-123" or "123" */
export function resolveVendorId(idParam) {
  if (!idParam) return null;
  const m = idParam.match(/^VDR-(\d+)$/);
  return m ? parseInt(m[1], 10) : (isNaN(parseInt(idParam, 10)) ? null : parseInt(idParam, 10));
}
