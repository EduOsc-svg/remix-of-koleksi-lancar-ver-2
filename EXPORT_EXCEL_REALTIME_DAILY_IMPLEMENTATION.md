# Export Excel Penagihan - Real-Time Daily Parameter Implementation

## 📋 Konsep Implementasi

Semua export Excel pada halaman Collection (Penagihan) telah diimplementasikan untuk menggunakan **parameter hari yang real-time**. Artinya:

- ✅ Setiap hari memiliki data yang berbeda
- ✅ File yang diekspor otomatis menggunakan tanggal hari itu
- ✅ Header Excel menampilkan tanggal sesuai hari terpilih
- ✅ Filename mencerminkan tanggal data (YYYY-MM-DD)
- ✅ Laporan dapat diprint setiap hari dengan konsistensi

---

## 🗂️ Daftar Export Functions

### 1. **Export Payment Per Collector Daily**
**File:** `src/lib/exportPaymentPerCollectorDaily.ts`

**Signature:**
```typescript
export const exportPaymentPerCollectorDaily = async (
  payments: PaymentWithRelations[],
  contracts: any[],
  selectedDate: string  // ← Parameter real-time
) => { ... }
```

**Penggunaan Tanggal:**
- ✅ Header Summary: `Tanggal: ${new Date(selectedDate).toLocaleDateString(...)}`
- ✅ Header Per Sheet: `Tanggal: ${new Date(selectedDate).toLocaleDateString(...)} | Kolektor: ...`
- ✅ Filename: `Pembayaran_${selectedDate}_Per_Kolektor.xlsx` (format: 2026-05-01)

**Data Source:**
- Hook: `usePayments(selectedDate, selectedDate)` → Filter 1 hari
- Akan menampilkan hanya pembayaran dari hari yang dipilih

**UI Location:** Collection → Input Pembayaran Tab → "Export Per Kolektor" Button

---

### 2. **Export Payment Input to Excel**
**File:** `src/lib/exportPaymentInput.ts`

**Signature:**
```typescript
export const exportPaymentInputToExcel = async (
  payments: PaymentWithRelations[],
  contracts: any[],
  selectedDate?: string  // ← Parameter real-time (optional fallback)
) => { ... }
```

**Penggunaan Tanggal:**
- ✅ Header: `Per tanggal: ${exportDate.toLocaleDateString(...)}`
- ✅ Filename: `Input_Pembayaran_${selectedDate}.xlsx`

**Data Source:**
- Hook: `usePayments(selectedDate, selectedDate)` → Filter 1 hari
- Akan menampilkan hanya pembayaran dari hari yang dipilih

**UI Location:** Collection → Input Pembayaran Tab → "Export Excel" Button

---

### 3. **Export Handover Per Collector Daily**
**File:** `src/lib/exportHandoverPerCollectorDaily.ts`

**Signature:**
```typescript
export const exportHandoverPerCollectorDaily = async (
  handovers: EnrichedHandover[],
  selectedDate: string  // ← Parameter real-time
) => { ... }
```

**Penggunaan Tanggal:**
- ✅ Header Summary: `Tanggal: ${new Date(selectedDate).toLocaleDateString(...)}`
- ✅ Header Per Sheet: `Tanggal: ${new Date(selectedDate).toLocaleDateString(...)} | Kolektor: ...`
- ✅ Filename: `Serah_Terima_Kupon_${selectedDate}_Per_Kolektor.xlsx`

**Data Source:**
- Hook: `useCouponHandovers(selectedDate)` → Filter 1 hari
- Akan menampilkan hanya serah terima dari hari yang dipilih

**UI Location:** Collection → Outstanding Coupons Tab → "Export Per Kolektor" Button

---

## 🔄 Data Flow (Real-Time Daily)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Collection Page                              │
│  selectedDate: string (date picker → state)                      │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ├─────→ Input Pembayaran Tab
           │       ├─ usePayments(selectedDate, selectedDate)
           │       │  └─ Fetch: WHERE payment_date = selectedDate
           │       ├─ Export Per Kolektor
           │       │  └─ exportPaymentPerCollectorDaily(payments, contracts, selectedDate)
           │       │     └─ Header: "Tanggal: ${selectedDate}"
           │       │     └─ File: Pembayaran_${selectedDate}_Per_Kolektor.xlsx
           │       └─ Export Excel
           │          └─ exportPaymentInputToExcel(payments, contracts, selectedDate)
           │             └─ Header: "Per tanggal: ${selectedDate}"
           │             └─ File: Input_Pembayaran_${selectedDate}.xlsx
           │
           └─────→ Outstanding Coupons Tab
               ├─ useCouponHandovers(selectedDate)
               │  └─ Fetch: WHERE handover_date = selectedDate
               └─ Export Per Kolektor
                  └─ exportHandoverPerCollectorDaily(handovers, selectedDate)
                     └─ Header: "Tanggal: ${selectedDate}"
                     └─ File: Serah_Terima_Kupon_${selectedDate}_Per_Kolektor.xlsx
```

---

## 📊 Contoh Penggunaan Harian

### Hari Ke-1: 2026-05-01 (Mei 1)
```
1. User membuka Collection page
2. selectedDate = "2026-05-01"
3. Data yang ditampilkan:
   - Pembayaran dari 1 Mei 2026
   - Serah terima kupon dari 1 Mei 2026
4. Export files:
   - Pembayaran_2026-05-01_Per_Kolektor.xlsx
     Header: "Tanggal: 1 Mei 2026"
   - Input_Pembayaran_2026-05-01.xlsx
     Header: "Per tanggal: 1 Mei 2026"
   - Serah_Terima_Kupon_2026-05-01_Per_Kolektor.xlsx
     Header: "Tanggal: 1 Mei 2026"
```

### Hari Ke-2: 2026-05-02 (Mei 2)
```
1. User navigasi ke tanggal berikutnya
2. selectedDate = "2026-05-02"
3. Data yang ditampilkan:
   - Pembayaran dari 2 Mei 2026 (data berbeda!)
   - Serah terima kupon dari 2 Mei 2026 (data berbeda!)
4. Export files:
   - Pembayaran_2026-05-02_Per_Kolektor.xlsx
     Header: "Tanggal: 2 Mei 2026"
   - Input_Pembayaran_2026-05-02.xlsx
     Header: "Per tanggal: 2 Mei 2026"
   - Serah_Terima_Kupon_2026-05-02_Per_Kolektor.xlsx
     Header: "Tanggal: 2 Mei 2026"
```

---

## ✅ Verification Checklist

### Export Per Collector Daily (Payment)
- [x] Function signature menerima `selectedDate: string`
- [x] Header menampilkan tanggal dari selectedDate
- [x] Filename menggunakan selectedDate format YYYY-MM-DD
- [x] Dipanggil dengan `selectedDate` parameter
- [x] Data terfiter 1 hari saja

### Export Payment Input
- [x] Function signature menerima `selectedDate?: string`
- [x] Header menampilkan tanggal dari selectedDate
- [x] Filename menggunakan selectedDate format YYYY-MM-DD
- [x] Dipanggil dengan `selectedDate` parameter
- [x] Data terfiter 1 hari saja

### Export Handover Per Collector Daily
- [x] Function signature menerima `selectedDate: string`
- [x] Header menampilkan tanggal dari selectedDate
- [x] Filename menggunakan selectedDate format YYYY-MM-DD
- [x] Dipanggil dengan `selectedDate` parameter
- [x] Data terfiter 1 hari saja

---

## 🎯 Key Features

✨ **Real-Time Daily Concept:**
- Setiap tanggal memiliki laporan terpisah
- Laporan dapat diprint harian dengan konsistensi
- Data berbeda setiap harinya (dynamic)
- Tidak ada data cross-day mixing

📊 **Consistency Across Exports:**
- UI data = Exported data (100% match)
- Header date = Data date (100% match)
- Filename = Data date (100% match)
- Column counts & values = Identical

🔄 **Data Source:**
- Payment exports: `usePayments(selectedDate, selectedDate)`
- Handover exports: `useCouponHandovers(selectedDate)`
- Contracts: Filtered berdasarkan relasi dengan payments/handovers

📱 **User Experience:**
- Change date → Data berubah
- Click Export → File dengan tanggal benar
- Open file → Header & data sesuai ekspektasi
- Print harian → Laporan terorganisir per tanggal

---

## 🚀 Deployment Status

✅ **PRODUCTION READY**
- All functions implemented with real-time daily parameter
- All exports using selectedDate consistently
- No TypeScript errors
- Data consistency verified
- Documentation complete
- Ready for daily use

---

## 📝 Notes

1. **Date Format in Filename:** YYYY-MM-DD (ISO format)
   - Memudahkan sorting & organizing files
   - Konsisten dengan standard international

2. **Date Format in Header:** Long format dengan bahasa Indonesia
   - "1 Mei 2026" (user-friendly)
   - Sesuai untuk print/report

3. **Fallback Logic:** 
   - `exportPaymentInputToExcel` memiliki optional parameter
   - Jika `selectedDate` kosong → gunakan `new Date()` (today)

4. **Future Enhancement:**
   - Bisa tambahan date range export (multi-day) jika diperlukan
   - Bisa tambahan monthly consolidation report
   - Bisa automation untuk daily export schedule

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `src/pages/Collection.tsx` | Main collection page |
| `src/lib/exportPaymentPerCollectorDaily.ts` | Export payment per collector |
| `src/lib/exportPaymentInput.ts` | Export payment input |
| `src/lib/exportHandoverPerCollectorDaily.ts` | Export handover per collector |
| `src/hooks/usePayments.ts` | Payment data hook |
| `src/hooks/useCouponHandovers.ts` | Handover data hook |
