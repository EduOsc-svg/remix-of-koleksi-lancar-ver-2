# Perubahan: Export Pembayaran - Format Bulk (Summary Per Kontrak)

## Ringkasan Perubahan

**File:** `/src/lib/exportPaymentInput.ts`

Export pembayaran diubah dari format detail (per pembayaran individual) menjadi format **BULK** (summary per kontrak) untuk menghemat ruang dan memudahkan review.

---

## Perbandingan Format

### Format Lama (DETAIL - Per Pembayaran)
```
No | Konsumen | Kode Kontrak | Pembayaran Ke | Jumlah Kupon | Tertagih | Angsuran | Tertagih (Rp)
 1 | Budi     | A001         | 1             | 1            | 1        | Rp 10k   | Rp 10k
 2 | Budi     | A001         | 2             | 1            | 1        | Rp 10k   | Rp 10k
 3 | Budi     | A001         | 3             | 1            | 1        | Rp 10k   | Rp 10k
 4 | Ahmad    | A002         | 1             | 1            | 1        | Rp 8k    | Rp 8k
 5 | Ahmad    | A002         | 2             | 1            | 1        | Rp 8k    | Rp 8k
TOTAL                                         | 5            | 5        |          | Rp 54k
```
❌ **Banyak baris untuk kontrak yang sama** (tidak efisien, memakan ruang)

### Format Baru (BULK - Summary Per Kontrak)
```
No | Konsumen | Kode Kontrak | Jumlah Pembayaran | Jumlah Kupon | Angsuran | Total Tertagih (Rp)
 1 | Budi     | A001         | 3                 | 3            | Rp 10k   | Rp 30k
 2 | Ahmad    | A002         | 2                 | 2            | Rp 8k    | Rp 16k
TOTAL                                            | 5            |          | Rp 46k
```
✅ **Satu baris per kontrak** (ringkas, hemat ruang, mudah dibaca)

---

## Struktur Kolom Baru (BULK)

| Kolom | Tipe | Formula/Asal | Format | Keterangan |
|-------|------|--------------|--------|------------|
| A: No | Number | Sequential | Default | 1, 2, 3, ... |
| B: Konsumen | Text | customer.name | Text | Nama pelanggan |
| C: Kode Kontrak | Text | contract_ref | Text | Kode kontrak (unik) |
| D: Jumlah Pembayaran | Number | COUNT(payments) | #,##0 | Jumlah transaksi pembayaran untuk kontrak ini |
| E: Jumlah Kupon | Number | SUM(payments) | #,##0 | Total kupon dibayar (= Jumlah Pembayaran) |
| F: Angsuran | Currency | daily_installment_amount | Rp | Amount per kupon |
| G: Total Tertagih (Rp) | Currency | E × F | Rp | Total nilai yang tertagih untuk kontrak |

---

## Logika Aggregasi

### Contoh:
Jika kontrak A001 memiliki 5 pembayaran (tanggal berbeda):

```
Pembayaran 1: Rp 10.000
Pembayaran 2: Rp 10.000
Pembayaran 3: Rp 10.000
Pembayaran 4: Rp 10.000
Pembayaran 5: Rp 10.000
───────────────────────
Jumlah Pembayaran: 5
Jumlah Kupon: 5 (1 pembayaran = 1 kupon)
Angsuran: Rp 10.000 (dari contract.daily_installment_amount)
Total Tertagih (Rp): 5 × Rp 10.000 = Rp 50.000
```

### Rumus Excel:
- **Jumlah Pembayaran** = COUNT(pembayaran per kontrak)
- **Jumlah Kupon** = SUM(1 per pembayaran)
- **Angsuran** = Fixed value dari contract
- **Total Tertagih (Rp)** = Jumlah Kupon × Angsuran = `E × F`

---

## Total Row (BULK)

```
TOTAL | SUM(D) | SUM(E) | [empty] | SUM(G)
      | 10     | 10     |         | Rp 96.000
```

Kolom yang di-SUM:
- **E**: Sum dari Jumlah Kupon semua kontrak
- **G**: Sum dari Total Tertagih (Rp) semua kontrak

---

## Keuntungan Format Bulk

✅ **Hemat Ruang:** 1 baris per kontrak, bukan per pembayaran
✅ **Mudah Dibaca:** Summary jelas, langsung lihat total per kontrak
✅ **Efisien:** Cocok untuk review cepat
✅ **Sorting:** Otomatis terurut by Kode Kontrak (A-Z)
✅ **Total Row:** Langsung lihat total dari semua kontrak

---

## Perubahan Teknis

### Struktur Data BulkPaymentSummary:
```typescript
interface BulkPaymentSummary {
  contractId: string;              // ID kontrak
  customerName: string;             // Nama pelanggan
  contractRef: string;              // Kode kontrak
  paymentCount: number;             // Jumlah pembayaran
  totalCoupons: number;             // Total kupon (= paymentCount)
  dailyAmount: number;              // Angsuran per kupon
  totalAmount: number;              // Total = totalCoupons × dailyAmount
}
```

### Proses Aggregasi:
1. Loop semua pembayaran
2. Group by contract_id
3. Hitung: paymentCount, totalCoupons, dailyAmount, totalAmount
4. Sort by contractRef (A-Z)
5. Output ke Excel

---

## Title & Heading

- **Title:** `LAPORAN INPUT PEMBAYARAN (BULK)`
- **Merge Cells:** A1:G1 (7 kolom, bukan 8)
- **Date Info:** A2:G2

---

## Testing Checklist

- [ ] Download export pembayaran dari tab "Input Pembayaran"
- [ ] File memiliki 7 kolom (tidak ada "Pembayaran Ke" dan "Tertagih" lagi)
- [ ] Kolom: No | Konsumen | Kode Kontrak | Jumlah Pembayaran | Jumlah Kupon | Angsuran | Total Tertagih (Rp)
- [ ] Satu baris per kontrak (bulk summary)
- [ ] Jumlah baris = jumlah kontrak yang ada pembayaran (tidak 1 baris per pembayaran)
- [ ] Total row menampilkan SUM untuk E (Jumlah Kupon) dan G (Total Tertagih)
- [ ] Format currency untuk Angsuran dan Total Tertagih (Rp)
- [ ] Kontrak terurut by Kode Kontrak (A-Z)
- [ ] Ruang file lebih kecil (hemat space)

---

## Contoh Real

**Dataset:** 100 pembayaran dari 15 kontrak berbeda

### Sebelumnya (DETAIL):
```
100 baris data + 1 baris total = 101 baris
File besar, susah untuk overview
```

### Sekarang (BULK):
```
15 baris data + 1 baris total = 16 baris
File kecil, mudah untuk overview
```

**Efisiensi:** ~85% lebih sedikit baris ✨

---

## Files Modified

1. `src/lib/exportPaymentInput.ts`
   - Ubah struktur dari detail ke bulk
   - Implementasi Map untuk aggregasi
   - Update HEADERS (7 kolom)
   - Update COL_WIDTHS
   - Update merge cells (A1:G1, A2:G2)
   - Remove row number variable (tidak perlu)

## Notes

- Format ini lebih cocok untuk **Input Bulk** (satu transaksi entry per kontrak)
- Jika user butuh detail, bisa tetap lihat di tab "Belum Bayar" atau "Manifest"
- Sorting otomatis by Kode Kontrak untuk kemudahan review
- Formula Total Row tetap menggunakan SUM untuk dynamic calculation
