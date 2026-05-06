# Perubahan: Export Serah Terima Kupon - Kolom Tertagih Dihapus

## Ringkasan Perubahan

**File:** `/src/lib/exportOutstandingCoupons.ts`

### Perubahan Per-Collector Sheet

#### Kolom Sebelumnya:
```
No | Tanggal | Konsumen | Kode Kontrak | Pembayaran Ke | Jumlah Kupon | Tertagih | Angsuran | Tertagih (Rp)
 1 |    2    |    3     |      4       |      5        |      6       |    7     |    8     |      9
```

#### Kolom Sekarang:
```
No | Tanggal | Konsumen | Kode Kontrak | Pembayaran Ke | Jumlah Kupon | Angsuran | Tertagih (Rp)
 1 |    2    |    3     |      4       |      5        |      6       |    7     |      8
```

#### Kolom yang Dihapus:
- ❌ **Tertagih** (kolom lama #7)

#### Rumus Tertagih (Rp) - Diubah:
- **Sebelumnya:** `Tertagih × Angsuran` = `G × H` (Tertagih * Angsuran)
- **Sekarang:** `Jumlah Kupon × Angsuran` = `F × G` (Jumlah Kupon * Angsuran)

### Master Sheet (Tetap Sama)

Master sheet "Semua Kolektor" tidak berubah:
```
No | Kolektor | Kode Sales | Kode Kolektor | Konsumen | Kode Kontrak | Pembayaran ke | Jumlah Kupon | Status | Nominal/Kupon | Total Nominal | Sisa (Rp)
```

Rumus master sheet (sudah benar):
- **Total Nominal** = `Jumlah Kupon × Nominal/Kupon` = `H × J`
- **Sisa (Rp)** = `Total Nominal × <tidak ada lagi status tambahan>`

## Detail Perubahan

### Struktur Data (Per-Collector)

| Kolom | Cell | Tipe | Nilai/Formula | Format |
|-------|------|------|---------------|---------|
| No | A | Number | i+1 | Default |
| Tanggal | B | Date | handover_date | DD/MM/YYYY |
| Konsumen | C | Text | customer.name | Text |
| Kode Kontrak | D | Text | contract_ref | Text |
| Pembayaran Ke | E | Text | start_index-end_index | Text |
| Jumlah Kupon | F | Number | coupon_count | #,##0 |
| Angsuran | G | Currency | daily_installment_amount | Rp #,##0 |
| **Tertagih (Rp)** | **H** | **Currency** | **F×G** | **Rp #,##0** |

### Total Row (Per-Collector)

```
[Empty] | [Empty] | TOTAL | [Empty] | [Empty] | SUM(F) | [Empty] | SUM(H)
```

Kolom yang di-SUM:
- **F**: Sum dari Jumlah Kupon semua row
- **H**: Sum dari Tertagih (Rp) semua row

## Logika Penghitungan

### Sebelumnya (SALAH):
```
Tertagih (Rp) = Tertagih × Angsuran
              = (jumlah kupon yang sudah dibayar) × (daily installment)
```
❌ Ini mencerminkan kupon yang sudah tertagih, bukan total kontrak.

### Sekarang (BENAR):
```
Tertagih (Rp) = Jumlah Kupon × Angsuran
              = (total kupon di batch ini) × (daily installment)
              = Nilai total dari batch kupon
```
✅ Ini mencerminkan nilai total dari semua kupon dalam batch serah terima.

## Visualisasi Perubahan

### Contoh Data

**Contract:** A001, Jumlah Tenor: 100 hari, Daily Amount: Rp 10.000
**Handover Batch:** Kupon 1-50 diserahkan

#### Perhitungan Sebelumnya:
```
Jumlah Kupon: 50
Tertagih (dibayar): 30
Angsuran: Rp 10.000

Tertagih (Rp) = 30 × Rp 10.000 = Rp 300.000
Sisa: 20 kupon unpaid
```

#### Perhitungan Sekarang:
```
Jumlah Kupon: 50
Angsuran: Rp 10.000

Tertagih (Rp) = 50 × Rp 10.000 = Rp 500.000
Status: Menunjukkan nilai total batch
```

## Files Modified

1. `src/lib/exportOutstandingCoupons.ts`
   - Hapus "Tertagih" dari COLLECTOR_HEADERS
   - Update COLLECTOR_COL_WIDTHS (8 kolom, bukan 9)
   - Update dataRowValues untuk isCollectorSheet (8 values, bukan 9)
   - Update rumus: `F${rowNum}*G${rowNum}` (bukan `G${rowNum}*H${rowNum}`)
   - Update totalRowValues untuk isCollectorSheet (8 columns)
   - Update formatting untuk per-collector sheets

## Testing Checklist

- [ ] Download export serah terima
- [ ] Per-collector sheet memiliki 8 kolom (tidak ada "Tertagih")
- [ ] Kolom: No | Tanggal | Konsumen | Kode Kontrak | Pembayaran Ke | Jumlah Kupon | Angsuran | Tertagih (Rp)
- [ ] Rumus Tertagih (Rp) = Jumlah Kupon × Angsuran
- [ ] Total row menampilkan SUM untuk Jumlah Kupon dan Tertagih (Rp)
- [ ] Master sheet "Semua Kolektor" masih normal (12 kolom)
- [ ] Format currency untuk kolom Angsuran dan Tertagih (Rp) benar
- [ ] Tidak ada kolom kosong di antara Jumlah Kupon dan Angsuran

## Notes

- Rumus master sheet **tidak berubah**, hanya per-collector sheet yang dimodifikasi
- Kolom Tertagih yang dihapus adalah kolom **h.paidInRange** (jumlah kupon yang sudah dibayar)
- Rumus baru lebih akurat karena menghitung total nilai batch, bukan nilai yang sudah dibayar
- Format tetap Rp currency untuk Angsuran dan Tertagih (Rp)
