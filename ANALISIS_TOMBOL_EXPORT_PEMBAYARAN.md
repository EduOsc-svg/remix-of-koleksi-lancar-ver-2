# Analisis Tombol Export pada Tab "Input Pembayaran"

## Deskripsi Singkat
Tab **"Input Pembayaran"** (value="payment") pada halaman Collection menampilkan 1 tombol export dengan kondisi enable/disable tertentu.

---

## Tombol Export yang Tampil

### 1. **Export Per Kolektor** ✓
**Lokasi:** `src/pages/Collection.tsx`, lines 227-248

```tsx
<Button 
  variant="outline" 
  onClick={() => {
    const hasData = (payments && payments.length > 0) || (handovers && handovers.length > 0);
    if (!hasData) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }
    try {
      exportPaymentPerCollectorDaily(payments, contracts || [], selectedDate, handovers || []);
      toast.success("Export pembayaran per kolektor berhasil");
    } catch (error) {
      toast.error("Gagal export pembayaran per kolektor");
      console.error(error);
    }
  }}
  disabled={paymentsLoading || handoversLoading}
>
  <Download className="mr-2 h-4 w-4" /> Export Per Kolektor
</Button>
```

#### Kapan Tombol Diaktifkan (Enabled)?
- ✅ **Ketika**: `paymentsLoading === false` **DAN** `handoversLoading === false`
- Artinya: tombol aktif setelah data payments dan handovers selesai dimuat.

#### Kapan Tombol Dinonaktifkan (Disabled)?
- ❌ **Ketika**: `paymentsLoading === true` **ATAU** `handoversLoading === true`
- Artinya: selama data sedang di-fetch dari server, tombol tidak bisa diklik.

#### Kondisi Saat Diklik
1. **Cek data tersedia**: Memastikan minimal ada 1 payment atau 1 handover pada tanggal terpilih.
   - Jika tidak ada data → Tampil toast error "Tidak ada data untuk diexport"
   - Jika ada data → Lanjut ke step 2

2. **Export Excel**: Memanggil `exportPaymentPerCollectorDaily(payments, contracts, selectedDate, handovers)`
   - File yang dihasilkan: `Pembayaran_YYYY-MM-DD_Per_Kolektor.xlsx`
   - Konten: 2 sheet (Ringkasan + Per-Kolektor detail)
   - **Baru ditambahkan**: Kolom "Konsumen" (jumlah customer unik per kolektor)

3. **Feedback**: Tampil toast sukses atau error sesuai hasil export.

---

## Data yang Diperlukan Tombol

| Nama Variabel | Sumber Hook | Kondisi Load |
|---|---|---|
| `payments` | `usePayments(selectedDate, selectedDate)` | Dimuat berdasarkan `selectedDate` |
| `contracts` | `useContracts("active")` | Dimuat sekali saat komponen mount |
| `handovers` | `useCouponHandovers(selectedDate)` | Dimuat berdasarkan `selectedDate` |
| `selectedDate` | State lokal | User ubah via Input date picker |

---

## Alur Logika Tombol (Flowchart)

```
┌─────────────────────────────────────┐
│ User Klik "Export Per Kolektor"    │
└──────────────────┬──────────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │ Check: paymentsLoading OR    │ ──► TRUE  ─► [BUTTON DISABLED]
    │        handoversLoading?     │
    └──────────────────┬───────────┘
                       │ FALSE
                       ▼
    ┌──────────────────────────────┐
    │ Check: Ada payment OR        │ ──► FALSE ─► Show error toast
    │        ada handover?         │                 "Tidak ada data..."
    └──────────────────┬───────────┘
                       │ TRUE
                       ▼
    ┌──────────────────────────────┐
    │ Call exportPaymentPerCollector│
    │ Daily(payments, contracts,   │
    │        selectedDate, handovers)
    └──────────────────┬───────────┘
                       │
         ┌─────────────┴─────────────┐
         │ TRY/CATCH                │
         ▼                           ▼
    ✅ SUCCESS              ❌ ERROR
    Show success toast      Show error toast
    File downloaded         console.error()
```

---

## Catatan Teknis

### Ketergantungan Export
- **Dependensi utama**: `exportPaymentPerCollectorDaily()` dari `src/lib/exportPaymentPerCollectorDaily.ts`
- **Perubahan terbaru**:
  - ✨ Menambahkan kolom "Konsumen" (distinct customer count) di sheet summary.
  - ✨ Menampilkan "Jumlah Konsumen: N" di header tiap sheet per-kolektor.
  - 🔄 Menghitung konsumen dengan fallback: prefer `contract.customer_id` → fallback ke `customerName`.

### Perbedaan dengan Tab Lain
- **Tab "Manifest"**: Tidak ada tombol export (display saja).
- **Tab "Input Pembayaran"** ← **Anda di sini**: 1 tombol export (Export Per Kolektor).
- **Tab "Outstanding"**: Ada 2 button:
  1. HandoverCouponForm (untuk input serah terima kupon)
  2. Export Per Kolektor (untuk serah terima)

---

## Kesimpulan Singkat

| Aspek | Detail |
|---|---|
| **Tombol yang tampil** | 1: "Export Per Kolektor" |
| **Kondisi enabled** | Setelah data payments & handovers selesai dimuat |
| **Kondisi disabled** | Saat data masih di-loading |
| **Validasi data** | Minimal ada 1 payment atau handover |
| **Output** | Excel dengan 2 sheet + kolom konsumen baru |
| **User feedback** | Toast (sukses/error) |

