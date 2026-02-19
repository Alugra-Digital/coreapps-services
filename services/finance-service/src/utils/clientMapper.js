export function toDocSchema(row) {
  if (!row) return null;
  return {
    id: `CLI-${row.id}`,
    name: row.name,
    companyName: row.companyName ?? row.name,
    address: row.address ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    npwp: row.npwp ?? row.taxId ?? null,
    pic: row.pic ?? null,
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
  if (body.isActive !== undefined) m.isActive = body.isActive;
  return m;
}

/** Resolve :id param - accepts "CLI-123" or "123" */
export function resolveClientId(idParam) {
  if (!idParam) return null;
  const m = idParam.match(/^CLI-(\d+)$/);
  return m ? parseInt(m[1], 10) : (isNaN(parseInt(idParam, 10)) ? null : parseInt(idParam, 10));
}
