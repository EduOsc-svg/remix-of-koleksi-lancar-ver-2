# 📋 Metode Daftar Penagihan Harian (Daily Collection Queue Method)

## Overview

Metode Daftar Penagihan Harian adalah sistem workflow untuk mengelola penagihan kupon secara harian. Setiap handover batch dianggap sebagai 1 unit penagihan yang perlu diproses dalam 1 hari.

---

## Alur Kerja Per Hari

```
┌─────────────────────────────────────────────────────────────────┐
│                    HARI PERTAMA (Tgl X)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. PAGI - Serah Terima Kupon (Tab "Belum Bayar")             │
│     ├─ Input HandoverCouponForm                                │
│     ├─ Create record di coupon_handovers table                │
│     └─ Example: Budi diserahkan kupon 1-10 ke Kolektor A      │
│        ├─ start_index: 1                                      │
│        ├─ end_index: 10                                       │
│        ├─ coupon_count: 10                                    │
│        └─ current_installment_index: 0 (belum bayar)         │
│                                                                 │
│  2. SIANG - Input Pembayaran (Tab "Input Pembayaran")         │
│     ├─ DailyDueList menampilkan batch dari handover pagi      │
│     │  (karena: 0 < 1 = TRUE, belum ada pembayaran)          │
│     ├─ Kolektor A input hasil penagihan ke Budi             │
│     │  ├─ Bayar 7 kupon (index 1-7)                         │
│     │  ├─ Kembali 3 kupon (index 8-10)                       │
│     │  └─ Update current_installment_index: 7                │
│     └─ Status sekarang:                                        │
│        ├─ Paid: 7 kupon (1-7)                                │
│        ├─ Unpaid: 3 kupon (8-10)                             │
│        └─ Kupon sisa akan di-handover lagi besok             │
│                                                                 │
│  3. AKHIR HARI - Data Hilang dari Daftar                      │
│     ├─ Kondisi: currentIndex >= start_index                   │
│     ├─ Check: 7 >= 1 = TRUE                                   │
│     └─ Result: DailyDueList TIDAK menampilkan batch Budi     │
│        (batch sudah diproses, tidak bisa diinput lagi hari ini)│
│                                                                 │
│  4. SORE - Data Pembayaran Tersedia di Export                 │
│     └─ Export "Pembayaran Per Kolektor" tersedia untuk       │
│        laporan harian                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  HARI KEDUA (Tgl X+1)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. PAGI - Serah Terima Kupon BARU (Tab "Belum Bayar")        │
│     ├─ Input HandoverCouponForm baru                          │
│     ├─ Budi diserahkan sisa dari kemarin + baru               │
│     │  ├─ Option A: Kupon 8-10 (sisa) + 11-20 (baru)        │
│     │  │          = Diserahkan kupon 8-20 (total 13)         │
│     │  └─ Option B: Hanya kupon 11-20 (baru)                 │
│     │             Kupon 8-10 dianggap return/failed          │
│     └─ current_installment_index: masih 7 (dari kemarin)      │
│                                                                 │
│  2. SIANG - Input Pembayaran BARU (Tab "Input Pembayaran")    │
│     ├─ DailyDueList menampilkan batch handover pagi          │
│     │  (karena: 7 < 8 = TRUE, belum ada pembayaran batch ini) │
│     ├─ Kolektor A input hasil penagihan hari ini             │
│     └─ Proses berulang seperti hari pertama                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Logika Filter Status Pembayaran

### Filter pada Tab "Input Pembayaran"

```typescript
Filter Status Pembayaran:
├─ "Belum Bayar" (Default)
│  └─ Kondisi: currentIndex < start_index
│     └─ Tampilkan: Handover yang belum ada pembayaran sama sekali
│
├─ "Sebagian Bayar"
│  └─ Kondisi: start_index ≤ currentIndex < end_index
│     └─ Tampilkan: Handover yang sudah ada pembayaran tapi belum semua
│
├─ "Lunas"
│  └─ Kondisi: currentIndex ≥ end_index
│     └─ Tampilkan: Handover yang sudah lunas (semua dibayar)
│
└─ "Semua"
   └─ Tampilkan: Semua status tanpa filter
```

### Contoh Kalkulasi

```
Handover Batch:
├─ start_index: 1
├─ end_index: 10
├─ coupon_count: 10
└─ current_installment_index: 7

Status Determination:
├─ Check: 7 < 1 ? → FALSE (bukan "Belum Bayar")
├─ Check: 1 ≤ 7 < 10 ? → TRUE ✅ (IS "Sebagian Bayar")
└─ Check: 7 ≥ 10 ? → FALSE (bukan "Lunas")

Result: Filter "Sebagian Bayar" akan menampilkan batch ini ✅
```

---

## Transisi Status Detail

### Skenario 1: Belum Bayar → Sebagian Bayar

```
BEFORE (Hari X Pagi):
├─ Handover created: start=1, end=10
├─ current_index: 0
├─ Status: "Belum Bayar" ✅
└─ Tampil di DailyDueList: YA

AFTER (Hari X Sore - Bayar 5):
├─ Payment recorded: bayar index 1-5
├─ current_index updated: 5
├─ Status: "Sebagian Bayar" ✅
└─ Tampil di DailyDueList: TIDAK (karena >= start_index)
```

### Skenario 2: Sebagian Bayar → Lunas

```
BEFORE (Hari X+1 Pagi):
├─ Handover created: start=6, end=10 (sisa dari kemarin)
├─ current_index: 5
├─ Status: "Belum Bayar" ✅ (5 < 6)
└─ Tampil di DailyDueList: YA

AFTER (Hari X+1 Sore - Bayar semua):
├─ Payment recorded: bayar index 6-10
├─ current_index updated: 10
├─ Status: "Lunas" ✅
└─ Tampil di DailyDueList: TIDAK (karena >= start_index)
```

---

## Keuntungan Metode Ini

✅ **Prevents Double-Entry**
- Data tidak bisa diinput 2x dalam 1 hari
- Batch yang sudah diproses langsung hilang dari daftar

✅ **Clear Workflow**
- Setiap hari ada siklus yang jelas: Handover → Pembayaran → Sisa Kupon
- Auditor mudah track mana data yang sudah diproses

✅ **Flexible Payment**
- Bisa sebagian dibayar, sisanya di-handover lagi besok
- Bisa penuh dibayar, tidak perlu handover lagi

✅ **Audit Trail**
- Setiap pembayaran tercatat per handover batch
- Mudah track mana kupon yang sudah bayar, mana yang belum

✅ **Better Data Integrity**
- Menghindari confusion "kupon mana yang belum bayar"
- Setiap batch handover = 1 unit penagihan yang jelas

---

## Implementasi di Aplikasi

### Component: DailyDueList (Tab "Input Pembayaran")

```tsx
// Tampilkan hanya batch yang belum ada pembayaran
const buildRow = (h: CouponHandover): DueRow | null => {
  const currentIndex = h.credit_contracts?.current_installment_index || 0;
  const hasPaymentInBatch = currentIndex >= h.start_index;
  
  if (unpaid <= 0 || hasPaymentInBatch) return null; // HILANG
  
  return row; // TAMPIL
};
```

### Filter: Tab "Input Pembayaran"

```tsx
// Filter handovers berdasarkan payment status
const filteredHandovers = (handovers || []).filter((h: any) => {
  const currentIndex = h.credit_contracts?.current_installment_index || 0;
  
  if (paymentStatusFilter === "unpaid") {
    return currentIndex < h.start_index; // Belum Bayar
  } else if (paymentStatusFilter === "partial") {
    return currentIndex >= h.start_index && currentIndex < h.end_index; // Sebagian
  } else if (paymentStatusFilter === "paid") {
    return currentIndex >= h.end_index; // Lunas
  } else {
    return true; // All
  }
});
```

---

## Best Practice

1. **Always use Handover before Payment Input**
   - Serah terima kupon harus dilakukan terlebih dahulu
   - Baru bisa input pembayaran dari batch handover yang sudah ada

2. **One Handover = One Daily Collection**
   - Treat setiap handover batch sebagai unit penagihan 1 hari
   - Jangan campur handover dari hari sebelumnya dengan hari ini

3. **Track Return Coupons**
   - Kupon yang kembali (tidak dibayar) HARUS di-handover lagi besok
   - Jangan biarkan kupon "menggantung" tanpa status

4. **Use Export for Daily Report**
   - Export "Pembayaran Per Kolektor" untuk laporan harian
   - Data terstruktur per kolektor & per konsumen

---

## Troubleshooting

### Q: Data tidak muncul di DailyDueList
**A:** Cek apakah:
- Handover sudah dibuat di tab "Belum Bayar"?
- currentIndex >= start_index? (sudah ada pembayaran)
- Filter status pembayaran sesuai?

### Q: Bagaimana jika kupon tidak terjual (return)?
**A:** 
- Mark sebagai "return" di handover return form
- Di hari berikutnya, buat handover baru dengan kupon sisa

### Q: Bisa kah skip handover dan langsung bayar?
**A:** 
- Tidak disarankan - tapi bisa via fallback payments logic
- Untuk best practice, selalu handover terlebih dahulu

---

## Diagram State Transition

```
┌──────────────────┐
│   Belum Bayar    │  (currentIndex < start_index)
│  [Payable Status]│
└────────┬─────────┘
         │ Ada pembayaran
         ▼
┌──────────────────┐
│  Sebagian Bayar  │  (start_index ≤ currentIndex < end_index)
│ [In Progress]    │
└────────┬─────────┘
         │ Bayar semua
         ▼
┌──────────────────┐
│      Lunas       │  (currentIndex ≥ end_index)
│  [Completed]     │
└──────────────────┘
```

---

## Related Files

- `src/pages/Collection.tsx` - Main collection page dengan tab & filter
- `src/components/collection/DailyDueList.tsx` - Daily collection queue component
- `src/components/collection/HandoverCouponForm.tsx` - Handover input form
- `src/lib/exportPaymentPerCollectorDaily.ts` - Export pembayaran harian
- `src/lib/exportHandoverPerCollectorDaily.ts` - Export serah terima harian

---

**Last Updated:** May 15, 2026  
**Status:** ✅ Implemented & Documented
