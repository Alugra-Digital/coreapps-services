/**
 * Maps between DB employee schema and API doc schema (API_STRUCTURE.md).
 * Ensures exact compliance with documented request/response structure.
 */

const formatDate = (val) => {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

/**
 * Transform DB row to API doc schema
 */
export function toDocSchema(row) {
  if (!row) return null;
  return {
    id: `EMP-${row.id}`,
    nik: row.nik,
    namaKaryawan: row.name,
    namaJabatan: row.position ?? null,
    tipeKaryawan: row.employmentType ?? null,
    tmk: formatDate(row.tmk),
    noKtp: row.ktp ?? null,
    noKk: row.noKk ?? null,
    npwp: row.npwp ?? null,
    noHp: row.phoneNumber ?? null,
    email: row.email ?? null,
    pendidikan: row.educationLevel ?? null,
    statusPajak: row.taxStatus ?? null,
    statusPerkawinan: row.maritalStatus ?? null,
    jumlahAnak: row.numberOfChildren ?? 0,
    tempatLahir: row.placeOfBirth ?? null,
    tanggalLahir: formatDate(row.dateOfBirth),
    jenisKelamin: row.gender ?? null,
    alamatKtp: row.ktpAddress ?? null,
    kotaKtp: row.ktpCity ?? null,
    provinsiKtp: row.ktpProvince ?? null,
    noRek: row.bankAccountNumber ?? row.bankAccount ?? null,
    namaBank: row.bankName ?? null,
    noJknKis: row.jknNumber ?? null,
    noJms: row.jmsNumber ?? null,
    tanggalKeluar: formatDate(row.terminationDate),
    profilePictureUrl: row.profilePictureUrl ?? null,
    ktpDocumentUrl: row.ktpDocumentUrl ?? null,
    kkDocumentUrl: row.kkDocumentUrl ?? null,
    npwpDocumentUrl: row.npwpDocumentUrl ?? null,
  };
}

/**
 * Transform API doc request body to DB insert/update format
 */
export function fromDocSchema(body) {
  if (!body) return {};
  const map = {};
  if (body.nik != null) map.nik = body.nik;
  if (body.namaKaryawan != null) map.name = body.namaKaryawan;
  if (body.namaJabatan !== undefined) map.position = body.namaJabatan || null;
  if (body.tipeKaryawan !== undefined) map.employmentType = body.tipeKaryawan || null;
  if (body.tmk !== undefined) map.tmk = body.tmk || null;
  if (body.noKtp != null) map.ktp = body.noKtp;
  if (body.noKk != null) map.noKk = body.noKk;
  if (body.npwp != null) map.npwp = body.npwp;
  if (body.noHp != null) map.phoneNumber = body.noHp;
  if (body.email != null) map.email = body.email;
  if (body.pendidikan != null) map.educationLevel = body.pendidikan;
  if (body.statusPajak !== undefined) map.taxStatus = body.statusPajak || 'TK/0';
  if (body.statusPerkawinan !== undefined) map.maritalStatus = body.statusPerkawinan || null;
  if (body.jumlahAnak != null) map.numberOfChildren = body.jumlahAnak;
  if (body.tempatLahir != null) map.placeOfBirth = body.tempatLahir;
  if (body.tanggalLahir !== undefined) map.dateOfBirth = body.tanggalLahir || null;
  if (body.jenisKelamin !== undefined) map.gender = body.jenisKelamin || null;
  if (body.alamatKtp != null) map.ktpAddress = body.alamatKtp;
  if (body.kotaKtp != null) map.ktpCity = body.kotaKtp;
  if (body.provinsiKtp != null) map.ktpProvince = body.provinsiKtp;
  if (body.noRek != null) map.bankAccountNumber = body.noRek;
  if (body.namaBank != null) map.bankName = body.namaBank;
  if (body.noJknKis != null) map.jknNumber = body.noJknKis;
  if (body.noJms != null) map.jmsNumber = body.noJms;
  if (body.tanggalKeluar !== undefined) map.terminationDate = body.tanggalKeluar || null;
  return map;
}

/**
 * Resolve :id param to either DB id (number) or nik (string)
 * id can be "EMP-123" (use id 123) or "2024001" (use as nik)
 */
export function resolveEmployeeId(idParam) {
  if (!idParam) return { by: null, value: null };
  const empMatch = idParam.match(/^EMP-(\d+)$/);
  if (empMatch) return { by: 'id', value: parseInt(empMatch[1], 10) };
  return { by: 'nik', value: idParam };
}
