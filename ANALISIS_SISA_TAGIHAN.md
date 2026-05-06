# Analisis: Sisa Tagihan (Total to Collect) di Dashboard

## 📍 Lokasi dalam Kode

**File:** `/src/pages/Dashboard.tsx` (baris 668)
**Hook:** `useYearlyFinancialSummary()` dari `/src/hooks/useYearlyFinancialSummary.ts`

## 🔍 Rumus Perhitungan Sisa Tagihan

### Line 281 (useYearlyFinancialSummary.ts):
```typescript
const totalToCollect = (unpaidCoupons || []).reduce((s: number, c: any) => s + Number(c.amount || 0), 0);
```

## 📊 Penjelasan Detail

Sisa Tagihan (`total_to_collect`) adalah **JUMLAH TOTAL dari semua kupon cicilan yang belum dibayar** dalam tahun yang dipilih.

### Data Source:
- **Tabel Database:** `installment_coupons`
- **Filter Status:** `status = 'unpaid'` (hanya kupon yang belum dibayar)
- **Filter Tanggal:** `due_date` dalam range `yearStart` sampai `yearEnd` (tahun yang dipilih)

### Logika Query Supabase (line 130-133):
```typescript
{ data: unpaidCoupons, error: couponsError } = await supabase
  .from('installment_coupons')
  .select('amount, due_date, contract_id')
  .eq('status', 'unpaid')
  .gte('due_date', yearStart)
  .lte('due_date', yearEnd)
```

## 🧮 Contoh Perhitungan

Misalkan tahun 2026, ada 3 kontrak:

| Kontrak | Tenor | Cicilan Harian | Total Cicilan | Status Kupon | Due Date   |
|---------|-------|----------------|---------------|--------------|------------|
| A001    | 100   | Rp 10.000      | 1.000.000     | Paid: 50     | Jan - Apr  |
| A001    | 100   | Rp 10.000      | 1.000.000     | **Unpaid: 50** | **May - Jul** |
| A002    | 150   | Rp 8.000       | 1.200.000     | Paid: 80     | Jan - Apr  |
| A002    | 150   | Rp 8.000       | 1.200.000     | **Unpaid: 70** | **May - Sep** |
| A003    | 80    | Rp 12.000      | 960.000       | **Unpaid: 80** | **Jun - Aug** |

### Perhitungan Sisa Tagihan:
```
Kupon Unpaid A001: 50 kupon × Rp 10.000 = Rp 500.000
Kupon Unpaid A002: 70 kupon × Rp 8.000  = Rp 560.000
Kupon Unpaid A003: 80 kupon × Rp 12.000 = Rp 960.000
                                    ─────────────────
Total Sisa Tagihan (total_to_collect) = Rp 2.020.000
```

## 📈 Konteks di Dashboard

Di halaman Dashboard tahun 2026, ada 4 kartu summary:

```
┌─────────────────────────────────────────────────────────────┐
│  Jumlah Kontrak: 3                                          │
│  Sudah Tertagih: Rp 7.200.000 (dari payment_logs)          │
│  Sisa Tagihan: Rp 2.020.000 ← (dari unpaid coupons)        │
│  Tingkat Penagihan: 78% (= 7.2M / (7.2M + 2.02M))          │
└─────────────────────────────────────────────────────────────┘
```

## 🔗 Komponen yang Terkait

### 1. **Status Kupon yang Dihitung:**
- `'unpaid'` — Belum dibayar (masuk total_to_collect)
- `'paid'` — Sudah dibayar (tidak masuk total_to_collect)
- `'cancelled'` — Dibatalkan (tidak masuk total_to_collect)

### 2. **Sumber Kupon:**
File: `/src/hooks/useInstallmentCoupons.ts`
- Kupon otomatis dibuat saat kontrak aktif dibuat
- Jumlah kupon = tenor hari
- Tanggal kupon = mulai dari start_date kontrak hingga hari ke-tenor

### 3. **Pembayaran Kupon:**
File: `/src/pages/Collection.tsx`
- User menandai kupon sebagai "paid" saat melakukan pembayaran
- Amount pembayaran dicatat di `payment_logs`
- Status kupon berubah menjadi `'paid'`

## 💡 Penting: Perubahan Status Kupon

Sisa Tagihan akan **otomatis berkurang** jika:

1. **Kupon dibayar** → Status berubah `unpaid` → `paid`
2. **Kontrak di-return** → Semua kupon unpaid dibatalkan → Status `unpaid` → `cancelled`

### Perubahan Status Kontrak (Return/Macet):
File: `/src/pages/Contracts.tsx` (baris 580-597)

```typescript
// Saat return kontrak (tandai macet):
// 1. Status kontrak berubah ke 'returned'
// 2. Semua kupon unpaid dibatalkan (status → 'cancelled')
// 3. Toast: "Kontrak ditandai Macet (Return). Sisa tagihan & omset sales otomatis menyesuaikan."
// 4. Query cache di-invalidate: outstanding_coupons
```

## 📋 Ringkasan Formula

| Metrik | Sumber | Acuan Perhitungan |
|--------|--------|------------------|
| **Sisa Tagihan** | `installment_coupons` | SUM(amount WHERE status='unpaid' AND due_date IN tahun) |
| **Sudah Tertagih** | `payment_logs` | SUM(amount_paid WHERE payment_date IN tahun) |
| **Tingkat Penagihan** | Keduanya | (Tertagih / (Tertagih + Sisa)) × 100% |

## 🎯 Kesimpulan

**Sisa Tagihan di Dashboard adalah:**
- ✅ Jumlah total nilai kupon cicilan yang masih menunggu pembayaran
- ✅ Diambil dari tabel `installment_coupons` dengan filter status `'unpaid'`
- ✅ Hanya kupon dengan `due_date` di tahun yang dipilih yang dihitung
- ✅ Berubah otomatis saat kupon dibayar atau kontrak di-return
- ✅ Digunakan untuk menghitung Tingkat Penagihan (Collection Rate)
