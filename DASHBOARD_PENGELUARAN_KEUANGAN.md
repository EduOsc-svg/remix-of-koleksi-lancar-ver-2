# 📊 DASHBOARD PENGELUARAN KEUANGAN BULANAN (BPP)

**Status:** PENDING - Disimpan untuk implementasi di masa depan  
**Request By:** Bang Yadi  
**Date:** 15 Mei 2026

---

## 📋 Konsep Fitur

Dashboard untuk **melacak aliran uang** dari total tagihan konsumen bulanan ke mana saja digunakan/dialokasikan.

### Tujuan:
Menampilkan breakdown pengeluaran keuangan dan memastikan transparansi aliran uang setiap bulannya.

---

## 🎯 Kebutuhan Fungsional

### 1. **Input Pengeluaran**
- Form untuk mencatat pengeluaran harian/bulanan
- Fields yang diperlukan:
  - **Tanggal Pengeluaran** (date picker)
  - **Kategori Pengeluaran** (dropdown):
    - Pembelian Barang Kas (peralatan, supplies, dll)
    - Pembayaran Nota/Invoice (hutang supplier, layanan, dll)
    - [Kategori lain jika diperlukan]
  - **Nominal** (currency input)
  - **Deskripsi/Keterangan** (text area)
  - **Bukti/Lampiran** (optional - file upload)

### 2. **Dashboard/View**
Menampilkan breakdown pengeluaran dengan relasi ke total tagihan bulanan:

```
DASHBOARD PENGELUARAN KEUANGAN - MEI 2026
═════════════════════════════════════════════════════════

📥 TOTAL TAGIHAN MASUK:                Rp 50.000.000 (100%)

📤 PENGELUARAN:
   ├─ Pembelian Barang Kas             Rp 5.000.000  (10%)
   ├─ Pembayaran Invoice/Nota          Rp 30.000.000 (60%)
   └─ [Kategori Lain]                  Rp 5.000.000  (10%)
   ─────────────────────────────────────────────────────
   TOTAL PENGELUARAN                   Rp 40.000.000 (80%)

💰 SISA/KEUNTUNGAN:                    Rp 10.000.000 (20%)
═════════════════════════════════════════════════════════
```

**Visualisasi:**
- Pie chart untuk persentase pengeluaran per kategori
- Bar chart untuk trend bulanan
- Tabel detail rinci per pengeluaran

### 3. **Filter & Parameter**
- Filter berdasarkan **Bulan/Tahun**
- Filter berdasarkan **Kategori** pengeluaran
- Filter berdasarkan **Date Range** (rentang tanggal custom)

### 4. **Manajemen Data**
- **Create** - Tambah pengeluaran baru
- **Read** - Lihat daftar pengeluaran
- **Update** - Edit pengeluaran yang sudah tercatat
- **Delete** - Hapus pengeluaran (soft delete / dengan audit trail)

---

## 🗄️ Database Schema (Planned)

```sql
CREATE TABLE financial_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'pembelian_kas', 'pembayaran_invoice', etc
  nominal DECIMAL(15,2) NOT NULL,
  description TEXT,
  attachment_url VARCHAR(255),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- soft delete
);

-- View untuk summary bulanan
CREATE VIEW v_expense_summary_monthly AS
SELECT 
  DATE_TRUNC('month', expense_date)::DATE AS month,
  category,
  SUM(nominal) AS total_amount,
  COUNT(*) AS count
FROM financial_expenses
WHERE deleted_at IS NULL
GROUP BY DATE_TRUNC('month', expense_date), category;
```

---

## 🎨 UI/UX Considerations

### Lokasi:
- [ ] Tab baru di Collection/Management page
- [ ] Menu terpisah di sidebar
- [ ] Dashboard utama (jika ada dedicated finance page)

### Design Elements:
- **Color Coding:**
  - Pembelian Barang Kas: 🔵 Blue
  - Pembayaran Invoice: 🟠 Orange
  - Sisa/Keuntungan: 🟢 Green

- **Cards/Stats:**
  - Total Tagihan Masuk (large, highlighted)
  - Total Pengeluaran (large, highlighted)
  - Sisa/Keuntungan (large, highlighted - dengan warna berbeda)

- **Table Format:**
  - Columns: No | Tanggal | Kategori | Nominal | Deskripsi | Action(Edit/Delete)
  - Sortable & Filterable
  - Pagination jika banyak data

---

## 🔐 Permission/Access Control

**Pertanyaan untuk Bang Yadi:**
- Siapa saja yang bisa **Create/Edit** pengeluaran?
  - Hanya Admin/Management?
  - Semua user?
- Siapa yang bisa **Delete** pengeluaran?
- Apakah ada approval workflow sebelum data disimpan?

---

## 📌 Related Data Sources

**Input Pengeluaran akan terhubung dengan:**
- Total tagihan bulanan dari `credit_contracts` + `payment_logs`
- Pembayaran yang masuk (untuk perhitungan sisa)

**Formula:**
```
Sisa/Keuntungan = Total Tagihan Masuk - Total Pengeluaran
```

---

## 🚀 Implementation Roadmap

### Phase 1: Database & Backend
- [ ] Create table `financial_expenses`
- [ ] Create view `v_expense_summary_monthly`
- [ ] Create API endpoints:
  - `POST /api/expenses` (create)
  - `GET /api/expenses?month=YYYY-MM` (read)
  - `PUT /api/expenses/:id` (update)
  - `DELETE /api/expenses/:id` (delete)

### Phase 2: Frontend Components
- [ ] Create `ExpenseForm.tsx` (input form)
- [ ] Create `ExpenseDashboard.tsx` (main dashboard)
- [ ] Create `ExpenseChart.tsx` (pie/bar chart)
- [ ] Create `ExpenseTable.tsx` (data table)

### Phase 3: Integration
- [ ] Integrate dengan total tagihan bulanan
- [ ] Add page/route untuk dashboard
- [ ] Add menu link di sidebar

### Phase 4: Enhancements
- [ ] Export ke Excel
- [ ] Reporting
- [ ] Audit trail/history
- [ ] Budget forecasting

---

## 📝 Notes

- **Simple & Clean Interface:** Fokus pada clarity, bukan kompleksitas
- **Real-time Calculation:** Total otomatis ter-update saat pengeluaran ditambah
- **Audit Trail:** Catat siapa yang membuat/edit/delete pengeluaran
- **Mobile Responsive:** Dashboard harus bisa diakses dari mobile

---

## ✅ Ready untuk dimulai kapan saja!

Silakan hubungi saat siap untuk implementasi fase 1.
