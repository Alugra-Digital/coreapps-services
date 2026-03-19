#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DB_URL });

const rawData = `1	11	AKTIVA LANCAR	
2	111	KAS DAN SETARA KAS	
3	11101	KAS	
4	1110101	Kas Head Office	
5	1110102	Kas Unit (Besar)	
6	1110104	Kas Kecil	
7	11102	BANK	
8	1110201	Bank Mandiri - 1570012305349, An. PT Alugra Digital Indonesia	
9	11103	DANA KERJA	
10	1110300	Dana Kerja	
11	112	INVESTASI JANGKA PENDEK	
12	11201	DEPOSITO	
13	1120101	Deposito	
14	11202	SURAT SURAT BERHARGA	
15	1120201	Saham	
16	1120202	OBLIGASI	
17	113	PIUTANG USAHA	
18	1130100	Piutang Pihak Ketiga	
19	114	PIUTANG LAIN-LAIN	
20	1140100	Piutang Staff	
21	1140200	Piutang Non Staff	
22	1140300	Piutang Direksi	
23	1140400	Piutang Kendaraan/Laptop	
24	1140500	Piutang Kontraktor	
25	1140700	Piutang Lainnya	
26	115	PAJAK DIBAYAR DI MUKA	
27	1150100	PPN Masukan	
28	1150200	PPh Ps 21	
29	1150300	PPh Ps 22	
30	1150400	PPh Ps 23	
31	1150500	PPh Ps 25	
32	1150600	PPh Final Ps 4 ayat 2 (PP 46 th 2013)	
33	1150700	PPh Ps 28a	
34	116	BIAYA DIBAYAR DI MUKA	
35	117	UANG MUKA	
36	1170100	Uang Muka Pengadaan Barang	
37	1170200	Uang Muka Kendaraan	
38	1170300	Uang Muka Perjalanan Dinas	
39	1170400	Uang Muka Lainnya	
40	1170500	Uang Muka Asuransi	
41	1170600	Uang Muka Pembelian Asset	
42	12	AKTIVA TIDAK LANCAR	
43	121	PIUTANG HUBUNGAN ISTIMEWA	
44	12101	PIUTANG HUBUNGAN ISTIMEWA (DALAM PT)	
45	1210101	Piutang Hub.Istimewa Dalam PT. ... - HO	
46	12102	PIUTANG HUB. ISTIMEWA (ANTAR PT)	
47	1210201	Piutang Hub.Istimewa (Antar PT) PT. Corocot Digital Kreatif - HO	
48	1210202	Piutang Hub.Istimewa Dalam PT. ...- HO	
49	1210203	Piutang Hub.Istimewa Dalam PT….- HO	
50	122	AKTIVA PAJAK TANGGUHAN	
51	123	INVESTASI JANGKA PANJANG	
52	1230101	Saham PT.xxx	
53	1230102	Obligasi PT.xxx	
54	1230199	Surat-surat berharga lainnya	
55	124	AKTIVA TETAP	
56	1240100	Bangunan & Tanah	
57	1240200	Kendaraan	
58	1240300	Peralatan dan Perabot	
59	12409	AKUMULASI PENYUSUTAN AKTIVA TETAP	
60	1240901	Akumulasi Penyusutan Bangunan	
61	1240902	Akumulasi Penyusutan Kendaraan	
62	1240903	Akumulasi Penyusutan Peralatan dan Perabot	
63	125	AKTIVA LAIN-LAIN	
64	1250100	Aktiva Tidak Berwujud	
65	1250200	Aktiva Dalam Konstruksi	
66	1250300	Biaya Pra-Operasi	
67	1250400	Biaya Ditangguhkan	
68	1250600	Aktiva Lainnya	
69	126	AYAT SILANG	
70	1260100	AYAT SILANG	
71	21	KEWAJIBAN LANCAR	
72	211	HUTANG USAHA (pasiva)	
73	2110100	Hutang Pemasok	
74	2110200	Hutang Kontraktor	
75	2110300	Hutang Retensi	
76	2110900	Hutang Lancar Lainnya	
77	212	HUTANG PAJAK	
78	2120100	Hutang PPN Keluaran - Penjualan	
79	2120200	Hutang PPh 21	
80	2120300	Hutang PPh 22	
81	2120400	Hutang PPh 23	
82	2120500	Hutang PPh Final Ps. 4 ayat 2	
83	2120600	Hutang PPh 25	
84	2120700	Hutang PPh 29	
85	2120800	Hutang PBB	
86	2120900	Hutang STP Pajak	
87	2120999	Hutang Pajak Lainnya	
88	213	BIAYA YANG MASIH HARUS DIBAYAR	
89	2130100	Gaji/Upah YMH Dibayar	
90	2130200	Premi Jamsostek - BPJS YMH Dibayar	
91	2130300	Dana Pensiun YMH Dibayar	
92	2130999	Biaya YMH Dibayar Lainnya	
93	214	PENDAPATAN DITERIMA DIMUKA	
94	2140100	Pendapatan diterima dimuka	
95	215	HUTANG BANK < 1 TAHUN	
96	2150100	Hutang Bank 	
97	216	HUTANG LEASING JT. TEMPO < 1 TAHUN	
98	2160100	Hutang Leasing 	
99	217	HUTANG LANCAR LAINNYA	
100	2170100	Hutang Dividen	
101	22	KEWAJIBAN TIDAK LANCAR	
102	221	HUTANG HUBUNGAN ISTIMEWA	
103	22101	Hutang Hubungan Istimewa (Dalam PT)	
104	2210101	Hutang Hub.Istimewa (Dalam PT) …	
105	22102	Hutang Hub.Istimewa (Antar PT)	
106	2210201	Hutang Hub.Istimewa (Antar PT) ...-HO	
107	2210202	Hutang Hub.Istimewa (Antar PT) ...-HO	
108	222	KEWAJIBAN PAJAK TANGGUHAN	
109	2220100	Kewajiban Pajak Tangguhan	
110	223	HUTANG BANK JK PANJANG > 1 TAHUN	
111	2230100	Hutang Bank	
112	224	HUTANG LEASING > 1 TAHUN	
113	2240100	Hutang Leasing	
114	225	KEWAJIBAN TIDAK LANCAR LAINNYA	
115	311	MODAL	
116	3110100	Modal Disetor	
117	3110200	Agio / Disagio Saham	
118	3110300	Uang Muka Setoran Modal	
119	312	LABA (RUGI) DITAHAN	
120	3120100	Dividen	
121	3120200	Laba (Rugi) Ditahan	
122	411	PENDAPATAN	
123	4110100	Pendapatan Usaha	
124	511	Beban Langsung	
125	5110101	Beban Karyawan	
126	5110102	Perjalanan Dinas	
127	5110103	Biaya Pemasaran	
128	5110104	Biaya Konsumsi	
129	5110105	Infrastruktur Jaringan dan Server	
130	5110106	Pengembangan Produk	
131	61	BEBAN ADMINISTRASI DAN UMUM	
132	611	BEBAN KARYAWAN	
133	6110100	Gaji	
134	6110200	Lembur / Premi	
135	6110300	Transport dan Uang Makan (Tunjangan Fasilitas)	
136	6110400	Tunjangan Komunikasi	
137	6110500	Tunjangan Pengobatan	
138	6110600	Tunjangan Perumahan	
139	6110700	Tunjangan Jamsostek & BPJS	
140	6110800	Tunjangan PPH 21	
141	6110900	Tunjangan Lainnya	
142	621	PERLENGKAPAN KANTOR 	
143	62101	PERLENGKAPAN  	
144	6210101	Alat Tulis Kantor	
145	6210102	Cetakan dan Formulir	
146	6210103	Biaya Fotocopy, Sewa Alat Fotocopy dan Jilid	
147	6210104	Materai	
148	6210105	Kirim Surat/Dokumen	
149	6210106	Majalah/Koran/Buku/Iklan	
150	6210107	Bahan Persediaan Konsumsi 	
151	62102	KOMUNIKASI	
152	6210201	Telephone	
153	6210202	V S A T / Internet	
154	6210203	TV Cable	
155	6210204	Aplikasi	
156	62103	KOMPUTER	
157	6210301	Operasional Komputer	
158	6210302	Pemeliharaan Unit Komputer	
159	6210303	Riset	
160	62104	LISTRIK DAN AIR	
161	6210401	Listrik	
162	6210402	Air	
163	62105	PERIJINAN DAN PAJAK	
164	6210501	PBB	
165	6210502	Perizinan Pusat	
166	6210503	Perizinan Tenaga Kerja Asing	
167	62106	PROFESI	
168	6210601	Akuntan Publik	
169	6210602	Apraisal	
170	6210603	Hukum dan Notaris	
171	6210604	Konsultan Lainnya	
172	62107	ASURANSI	
173	6210701	Asuransi Kebakaran	
174	6210702	Asuransi Kehilangan	
175	6210703	Asuransi Kecelakaan	
176	62108	BEBAN SEWA	
177	6210801	Sewa Bangunan	
178	6210802	Sewa Kendaraan	
179	6210803	Sewa Kantor	
180	62109	PEMELIHARAAN	
181	6210901	Pemeliharaan Bangunan	
182	6210902	Pemeliharaan Peralatan dan Perabot	
183	6210903	Pemeliharaan Kendaraan	
184	62110	PENGEMBANGAN KARYAWAN	
185	6211001	Pendidikan, Sosial, Olah Raga dan Rekreasi	
186	6211002	Pelatihan Karyawan	
187	6211003	Rekrutmen Karyawan	
188	6211004	House Ownership Program	
189	62111	PERJALANAN DINAS	
190	6211101	Perjalanan Dinas Komisaris dan Direksi	
191	6211102	Perjalanan Dinas Staff	
192	6211103	Perjalanan Dinas Non Staff	
193	62112	PENYUSUTAN	
194	6211201	Penyusutan Bangunan dan Perumahan	
195	6211202	Penyusutan Peralatan dan Perabot	
196	6211203	Penyusutan Kendaraan	
197	62113	KEAMANAN DAN SOSIAL LAINNYA	
198	6211301	Pengangkutan Barang	
199	6211302	Konsumsi Kantor	
200	6211303	Perayaan/Upacara	
201	6211304	Suka/Duka Cita	
202	6211305	Keamanan dan Kebersihan 	
203	711	PENDAPATAN LAIN LAIN	
204	7110101	Pendapatan Jasa Giro	
205	7110102	Pendapatan Bunga Deposito	
206	7110103	Selisih Kurs Valuta Asing	
207	7110104	Penjualan Barang Bekas	
208	7110105	Laba Penjualan Aktiva Tetap	
209	7110106	Pendapatan Deviden	
210	7110107	Pembatalan Subsidi Pelanggaran Karyawan	
211	7110108	Pendapatan Lainnya	
212	721	BEBAN LAIN-LAIN	
213	7210101	Beban Administrasi Bank	
214	7210102	Beban Pajak Jasa Giro	
215	7210103	Penghapusan Piutang	
216	7210104	Rugi Penjualan Aktiva Tetap	
217	7210105	Penghapusan Aktiva Tetap	
218	7210106	Pajak, Denda Pajak dan Lainnya	
219	731	BEBAN BUNGA	
220	73101	Kredit Jangka Panjang	
221	7310101	Bunga Bank Kredit Jangka Panjang	
222	73102	Kredit Modal Kerja	
223	7310201	Jenis Rekening	
224	73103	Leasing	
225	7310301	Bunga Leasing	
226	73104	Bunga Lainnya	
227	7310401	Jenis Rekening`;

function getAccountType(code) {
    if (code.startsWith('1')) return 'ASSET';
    if (code.startsWith('2')) return 'LIABILITY';
    if (code.startsWith('3')) return 'EQUITY';
    if (code.startsWith('4') || code.startsWith('71')) return 'REVENUE';
    if (code.startsWith('5') || code.startsWith('6') || code.startsWith('72') || code.startsWith('73')) return 'EXPENSE';
    return 'ASSET'; // Default
}

async function seedMasterAccounts() {
    console.log('\\n🌱 Seeding Master Accounts...\\n');

    const lines = rawData.trim().split('\\n');
    const accountsToInsert = [];

    for (const line of lines) {
        const parts = line.split('\\t');
        if (parts.length < 3) continue;
        let code = parts[1].trim();
        let name = parts[2].trim();
        let description = parts[3] ? parts[3].trim() : '';

        accountsToInsert.push({ code, name, description });
    }

    // Sort by code length to ensure parents are inserted before children
    accountsToInsert.sort((a, b) => a.code.length - b.code.length);

    // In PG, we return the inserted id
    const codeToIdMap = {};

    for (const acc of accountsToInsert) {
        const type = getAccountType(acc.code);

        // Find parent logic:
        // Usually code 11101 is child of 111. Let's try to match the longest prefix existing in codeToIdMap
        let parentAccountId = null;
        let isGroup = false;

        // Check if this account is a group (if other accounts start with this code and are longer)
        const hasChildren = accountsToInsert.some(a => a.code !== acc.code && a.code.startsWith(acc.code));
        if (hasChildren) isGroup = true;

        // Find parent
        // A parent's code must be a prefix of current code.
        let bestParentCode = null;
        for (const parentCode of Object.keys(codeToIdMap)) {
            if (acc.code.startsWith(parentCode) && acc.code !== parentCode) {
                if (!bestParentCode || parentCode.length > bestParentCode.length) {
                    bestParentCode = parentCode;
                }
            }
        }

        if (bestParentCode) {
            parentAccountId = codeToIdMap[bestParentCode];
        }

        try {
            const result = await pool.query(
                "INSERT INTO accounts (code, name, type, description, is_group, parent_account_id, created_at, updated_at) " +
                "VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) " +
                "ON CONFLICT (code) DO UPDATE SET " +
                "  name = EXCLUDED.name, " +
                "  type = EXCLUDED.type, " +
                "  is_group = EXCLUDED.is_group, " +
                "  parent_account_id = EXCLUDED.parent_account_id, " +
                "  description = EXCLUDED.description, " +
                "  updated_at = NOW() " +
                "RETURNING id",
                [acc.code, acc.name, type, acc.description, isGroup, parentAccountId]
            );
            codeToIdMap[acc.code] = result.rows[0].id;
            // console.log("✅ Inserted " + acc.code + " - " + acc.name);
        } catch (e) {
            console.error("❌ Failed to insert " + acc.code + " - " + acc.name + ":", e.message);
        }
    }

    console.log("   ✅ Finished seeding " + accountsToInsert.length + " accounts.\\n");
}

seedMasterAccounts()
    .then(() => pool.end())
    .catch((err) => {
        console.error('❌ Seed failed:', err.message);
        process.exit(1);
    });
