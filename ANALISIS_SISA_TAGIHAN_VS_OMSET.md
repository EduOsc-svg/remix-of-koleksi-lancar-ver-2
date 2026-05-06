# ANALISIS: Mengapa "Sisa Tagihan" Berbeda dengan Omset/Modal?

## 🔍 Perbedaan Fundamental

### **Omset & Modal = CONTRACT BASIS (Accrual)**
- **Acuan:** Nilai PENUH dari kontrak saat dibuat
- **Timing:** Diakui saat kontrak dibuat (start_date)
- **Sifat:** Fixed, tidak berubah sesuai realisasi pembayaran
- **Formula:**
  ```
  Total Omset = SUM(total_loan_amount) dari semua kontrak tahun ini
  Total Modal = SUM(omset field) dari semua kontrak tahun ini
  ```

### **Sisa Tagihan = CASH BASIS (Realisasi)**
- **Acuan:** Kupon cicilan YANG BELUM DIBAYAR saat ini
- **Timing:** Berdasarkan status pembayaran real-time (updatable)
- **Sifat:** Dinamis, berubah setiap kali ada pembayaran
- **Formula:**
  ```
  Sisa Tagihan = SUM(amount) dari installment_coupons 
                 WHERE status = 'unpaid' 
                 AND due_date dalam tahun ini
  ```

---

## 📊 Contoh Ilustrasi

### Scenario: 2 Kontrak di Tahun 2026

**Kontrak A001:**
- Total Omset: Rp 1.000.000
- Modal: Rp 800.000
- Tenor: 100 hari
- Daily Amount: Rp 10.000
- Created: 2026-01-01

**Kontrak A002:**
- Total Omset: Rp 1.200.000
- Modal: Rp 900.000
- Tenor: 150 hari
- Daily Amount: Rp 8.000
- Created: 2026-01-15

### **Dashboard Dashboard pada Hari 1 Januari 2026**

```
OMSET & MODAL AKURAT DARI AWAL:
└─ Total Omset: Rp 2.200.000 ✓ (Rp 1M + Rp 1.2M)
└─ Total Modal: Rp 1.700.000 ✓ (Rp 800k + Rp 900k)

SISA TAGIHAN FULL (BELUM ADA PEMBAYARAN):
└─ A001: 100 kupon × Rp 10k = Rp 1.000.000
└─ A002: 150 kupon × Rp 8k = Rp 1.200.000
└─ Sisa Tagihan: Rp 2.200.000 ✓ (= Omset saat awal)
```

### **Dashboard pada Hari 50 Hari Kemudian (50 pembayaran masuk)**

```
OMSET & MODAL TETAP SAMA (tidak berubah):
└─ Total Omset: Rp 2.200.000 ✓ (sama seperti awal)
└─ Total Modal: Rp 1.700.000 ✓ (sama seperti awal)

SISA TAGIHAN BERKURANG (ada pembayaran):
└─ A001: Sudah bayar 40, sisa 60 kupon
   └─ Sisa: 60 × Rp 10k = Rp 600.000
└─ A002: Sudah bayar 10, sisa 140 kupon
   └─ Sisa: 140 × Rp 8k = Rp 1.120.000
└─ Sisa Tagihan: Rp 1.720.000 ❌ (BERBEDA dari Omset!)

TINGKAT PENAGIHAN:
└─ Sudah Tertagih: (40×Rp10k) + (10×Rp8k) = Rp 480.000
└─ Collection Rate: 480k / 2.2M = 21.8%
```

### **Dashboard pada Hari 100 Hari Kemudian (SEMUA PEMBAYARAN MASUK)**

```
OMSET & MODAL TETAP SAMA:
└─ Total Omset: Rp 2.200.000 ✓
└─ Total Modal: Rp 1.700.000 ✓

SISA TAGIHAN BERKURANG DRASTIS:
└─ A001: Sudah bayar 100, sisa 0
   └─ Sisa: 0
└─ A002: Sudah bayar 80, sisa 70
   └─ Sisa: 70 × Rp 8k = Rp 560.000
└─ Sisa Tagihan: Rp 560.000 ❌ (JAUH BERBEDA dari Omset!)

TINGKAT PENAGIHAN:
└─ Sudah Tertagih: 1M + (80×Rp8k) = Rp 1.640.000
└─ Collection Rate: 1.64M / 2.2M = 74.5%
```

---

## 🎯 Perbedaan Metrik

| Metrik | Basis | Timing | Contoh (Hari 100) | Pola |
|--------|-------|--------|-------------------|------|
| **Total Omset** | Contract | Fixed (saat create) | Rp 2.200.000 | ➡️ Tetap |
| **Total Modal** | Contract | Fixed (saat create) | Rp 1.700.000 | ➡️ Tetap |
| **Sisa Tagihan** | Unpaid Coupons | Dynamic (real-time) | Rp 560.000 | ⬇️ Turun |
| **Sudah Tertagih** | Payments | Cumulative | Rp 1.640.000 | ⬆️ Naik |

---

## 📐 Formula Teknis

### Line 301: `useYearlyFinancialSummary.ts`

```typescript
const totalToCollect = (unpaidCoupons || []).reduce(
  (s: number, c: any) => s + Number(c.amount || 0), 
  0
);
```

### Query Supabase (Line 114-116):

```typescript
{ data: unpaidCoupons, error: couponsError } = await supabase
  .from('installment_coupons')
  .select('amount, due_date, contract_id')
  .eq('status', 'unpaid')
  .gte('due_date', yearStart)
  .lte('due_date', yearEnd)
```

### Breakdown:
1. **Sumber Data:** Tabel `installment_coupons`
2. **Filter Status:** `status = 'unpaid'` (hanya yang belum bayar)
3. **Filter Tanggal:** `due_date` dalam range tahun yang dipilih
4. **Perhitungan:** SUM(amount) dari semua kupon unpaid
5. **Update:** Real-time (saat ada pembayaran baru)

---

## ✅ Mengapa Ini Benar?

### **Omset/Modal = Rencana (Budget)**
- Menunjukkan target omset/modal saat kontrak dibuat
- **Gunakan untuk:** Analisis rencana revenue, budgeting
- **Benefit:** Konsisten, bisa dibandingkan antar bulan/tahun

### **Sisa Tagihan = Realisasi (Actual)**
- Menunjukkan utang aktual yang masih harus dikumpulkan
- **Gunakan untuk:** Monitoring cash flow, strategi penagihan
- **Benefit:** Akurat, langsung actionable

---

## 🔄 Timeline Sisa Tagihan

```
HARI 0 (Awal Tahun):
└─ Sisa Tagihan = Rp 2.200.000 (= Omset)
   [100% belum dibayar]

HARI 50:
└─ Sisa Tagihan = Rp 1.720.000 (berkurang)
   [Pembayaran mulai masuk]

HARI 100:
└─ Sisa Tagihan = Rp 560.000 (turun drastis)
   [Kontrak A001 fully paid, A002 sebagian bayar]

HARI 150 (AKHIR - Semua Bayar):
└─ Sisa Tagihan = Rp 0
   [100% collected]
```

**Omset tetap Rp 2.200.000 dari awal hingga akhir**
**Sisa Tagihan turun dari Rp 2.200.000 → Rp 0**

---

## 🎯 KPI Dashboard

Dalam dashboard, ada 4 kartu utama yang saling melengkapi:

| Kartu | Metrik | Basis | Gunakan Untuk |
|-------|--------|-------|---------------|
| **1** | Jumlah Kontrak | Count | Tracking kontrak |
| **2** | Sudah Tertagih | Payments (Cash) | Monitor revenue yang terrealisasi |
| **3** | **Sisa Tagihan** | Unpaid Coupons (Cash) | Monitor utang yang masih outstanding |
| **4** | Tingkat Penagihan % | Calculated (Realisasi) | Monitor efektivitas penagihan |

### Rumus Tingkat Penagihan:
```
Collection Rate = Sudah Tertagih / (Sudah Tertagih + Sisa Tagihan) × 100%

Contoh Hari 100:
= 1.640.000 / (1.640.000 + 560.000) × 100%
= 1.640.000 / 2.200.000 × 100%
= 74.5%
```

---

## ❌ Kesalahan Umum

### Expecting: `Sisa Tagihan = Omset - Sudah Tertagih`
```
SALAH! Ini hanya bekerja jika:
- Omset = Kumulative pembayaran maksimum
- Tidak ada default/macet/pembatalan
```

### Realitas: `Sisa Tagihan = SUM(unpaid coupons)`
```
BENAR! Ini:
- Direct dari data pembayaran real-time
- Tidak terpengaruh oleh hubungan antara kontrak
- Accurate untuk setiap scenario (macet, default, dsb)
```

---

## 📋 Summary Perbedaan

| Aspek | Omset/Modal | Sisa Tagihan |
|-------|-------------|-------------|
| **Definisi** | Nilai penuh kontrak | Nilai kupon belum bayar |
| **Source** | credit_contracts | installment_coupons |
| **Filter** | start_date, status≠returned | status=unpaid, due_date |
| **Timing** | Fixed (saat create) | Dynamic (real-time) |
| **Update** | Tidak berubah | Berubah saat pembayaran |
| **Purpose** | Budget/Planning | Cash/Realisasi |
| **Harapan di Awal Tahun** | = Sisa Tagihan ✓ |  = Omset ✓ |
| **Harapan di Akhir Tahun** | ≠ Sisa Tagihan ✓ | → 0 (fully collected) ✓ |

---

## 🚀 Kesimpulan

**Sisa Tagihan BENAR jika berbeda dengan Omset/Modal** karena:

1. ✅ **Basis berbeda:** Accrual vs Cash
2. ✅ **Timing berbeda:** Fixed vs Dynamic
3. ✅ **Source berbeda:** Contracts vs Coupons
4. ✅ **Purpose berbeda:** Planning vs Realisasi
5. ✅ **Behavior benar:** Omset tetap, Sisa turun seiring pembayaran

**Ini adalah design yang intentional dan BENAR** untuk memberikan visibility:
- **Omset/Modal:** Rencana revenue
- **Sisa Tagihan:** Cash outstanding yang perlu ditagih
- **Collection Rate:** Efektivitas penagihan

Jika ketiga metrik ini terlihat berbeda, itu adalah **indikator sehat** bahwa sistem tracking pembayaran berjalan dengan baik! 🎉
