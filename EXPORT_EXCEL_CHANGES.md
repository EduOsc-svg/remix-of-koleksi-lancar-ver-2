# Dokumentasi: Perubahan Export Excel

## Ringkasan Perubahan

Telah dilakukan 2 perubahan utama pada sistem export excel:

### 1. **Serah Terima Kupon (Master Sheet) - Hapus Kolom**

**File:** `/src/lib/exportOutstandingCoupons.ts`

#### Kolom Dihapus:
- ❌ Tanggal (Column B)
- ❌ Tertagih (Column J) 
- ❌ Belum Tagih (Column K)

#### Struktur Kolom Baru (Master Sheet):
```
A: No
B: Kolektor (sebelumnya C)
C: Kode Sales (sebelumnya D)
D: Kode Kolektor (sebelumnya E)
E: Konsumen (sebelumnya F)
F: Kode Kontrak (sebelumnya G)
G: Pembayaran ke (sebelumnya H)
H: Jumlah Kupon (sebelumnya I)
I: Status (sebelumnya L)
J: Nominal/Kupon (sebelumnya M)
K: Total Nominal (sebelumnya N)
L: Sisa (Rp) (sebelumnya P)
```

#### Per-Collector Sheet (Tetap Sama):
```
A: No
B: Tanggal
C: Konsumen
D: Kode Kontrak
E: Pembayaran Ke
F: Jumlah Kupon
G: Tertagih
H: Angsuran
I: Tertagih (Rp)
```

### 2. **Input Pembayaran - Export Baru**

**File:** `/src/lib/exportPaymentInput.ts` (BARU)

#### Fungsi:
`exportPaymentInputToExcel(payments: PaymentWithRelations[], contracts: any[])`

#### Struktur Kolom:
```
A: No
B: Konsumen
C: Kode Kontrak
D: Pembayaran Ke
E: Jumlah Kupon (selalu 1)
F: Tertagih (selalu 1)
G: Angsuran (daily_installment_amount)
H: Tertagih (Rp) = Tertagih × Angsuran
```

#### Fitur:
- ✅ Satu baris per pembayaran
- ✅ Jumlah Kupon & Tertagih selalu 1 (karena 1 pembayaran = 1 kupon)
- ✅ Total row dengan SUM formula
- ✅ Format currency untuk kolom Angsuran & Tertagih (Rp)
- ✅ Nama file: `Input_Pembayaran_YYYY-MM-DD.xlsx`

### 3. **UI Update - Tab Input Pembayaran**

**File:** `/src/pages/Collection.tsx`

#### Perubahan:
- ✅ Tambah import `usePayments` hook
- ✅ Tambah import `exportPaymentInputToExcel` function
- ✅ Tambah import icon `Download`
- ✅ Fetch payments data dari database
- ✅ Tambah button "Export Excel" di tab "Input Pembayaran"

#### Button Behavior:
```tsx
<Button 
  onClick={() => exportPaymentInputToExcel(payments, contracts)}
  disabled={paymentsLoading}
>
  <Download className="mr-2 h-4 w-4" /> Export Excel
</Button>
```

## Perbandingan Kolom

### Sebelum vs Sesudah (Master Sheet)

| Sebelum | Sesudah | Status |
|---------|---------|--------|
| No | No | ✅ |
| **Tanggal** | - | ❌ Dihapus |
| Kolektor | Kolektor | ✅ |
| Kode Sales | Kode Sales | ✅ |
| Kode Kolektor | Kode Kolektor | ✅ |
| Konsumen | Konsumen | ✅ |
| Kode Kontrak | Kode Kontrak | ✅ |
| Pembayaran ke | Pembayaran ke | ✅ |
| Jumlah Kupon | Jumlah Kupon | ✅ |
| **Tertagih** | - | ❌ Dihapus |
| **Belum Tagih** | - | ❌ Dihapus |
| Status | Status | ✅ |
| Nominal/Kupon | Nominal/Kupon | ✅ |
| Total Nominal | Total Nominal | ✅ |
| Tertagih (Rp) | - | ❌ Dihapus (diganti Sisa) |
| Sisa (Rp) | Sisa (Rp) | ✅ |

### Export Pembayaran (BARU)

| Kolom | Tipe | Formula |
|-------|------|---------|
| No | Counter | Sequential (1, 2, 3, ...) |
| Konsumen | Text | `payment.credit_contracts.customers.name` |
| Kode Kontrak | Text | `payment.credit_contracts.contract_ref` |
| Pembayaran Ke | Number | `payment.installment_index` |
| Jumlah Kupon | Number | 1 (fixed) |
| Tertagih | Number | 1 (fixed) |
| Angsuran | Currency | `contract.daily_installment_amount` |
| Tertagih (Rp) | Currency | `Tertagih × Angsuran` |

## Testing Checklist

- [ ] Download export serah terima: kolom Tanggal, Tertagih, Belum Tagih hilang
- [ ] Kolom baru terurut: Kolektor → Kode Sales → ... → Sisa (Rp)
- [ ] Per-collector sheet masih normal dengan 9 kolom
- [ ] Tab "Input Pembayaran" menampilkan button "Export Excel"
- [ ] Click button export: file `Input_Pembayaran_YYYY-MM-DD.xlsx` terdownload
- [ ] File pembayaran memiliki 8 kolom sesuai spec
- [ ] Total row menampilkan SUM formula dengan benar
- [ ] Format Rp untuk kolom Angsuran & Tertagih (Rp)

## Files Modified

1. `/src/lib/exportOutstandingCoupons.ts` - Hapus kolom dari master sheet
2. `/src/lib/exportPaymentInput.ts` - BARU: Export pembayaran
3. `/src/pages/Collection.tsx` - Tambah button export di tab pembayaran

## Notes

- Data pembayaran diambil dari tabel `payment_logs` via `usePayments()` hook
- Per pembayaran = 1 kupon (hence: Jumlah Kupon = 1, Tertagih = 1)
- Angsuran diambil dari `daily_installment_amount` kontrak
- Total formula: `Tertagih (Rp) = Tertagih × Angsuran`
