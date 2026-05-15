# Deskripsi Kolom - Laporan Input Pembayaran Per Kolektor

## Overview
Laporan "LAPORAN INPUT PEMBAYARAN - RINGKASAN PER KOLEKTOR" terdiri dari **2 sheet** di file Excel:
1. **Sheet "Ringkasan"** - Summary agregat per kolektor
2. **Sheet Per-Kolektor** - Detail transaksi per kolektor

---

## Sheet 1: Ringkasan Per Kolektor

### Header Kolom (7 kolom)

| # | Nama Kolom | Tipe Data | Deskripsi |
|---|---|---|---|
| **1** | **No** | Angka | Nomor urut (1, 2, 3, ...) |
| **2** | **Kolektor** | Teks | Nama kolektor yang mengumpulkan pembayaran |
| **3** | **Kode** | Teks | Kode unik kolektor (e.g., K001, K002) |
| **4** | **Konsumen** ⭐ | Angka | **[BARU]** Jumlah konsumen/customer unik yang dikumpulkan kolektor pada tanggal terpilih |
| **5** | **Total Kupon** | Angka | Jumlah kupon yang diserahkan ke kolektor (dari coupon_handovers) |
| **6** | **Total Dibayar** | Angka | Jumlah kupon yang sudah dibayar dari total kupon yang diterima |
| **7** | **Total Tertagih (Rp)** | Currency | Total nominal yang tertagih = Total Dibayar × Angsuran per Kupon |

### Format & Style
- **Header row**: Background biru (#4472C4), text putih, bold
- **Currency columns**: Format "Rp #,##0" (e.g., Rp 1,500,000)
- **Number columns**: Format "#,##0" dengan alignment center

---

## Sheet 2: Detail Per Kolektor

Setiap kolektor mendapat sheet terpisah dengan nama kolektor.

### Header Kolom (9 kolom)

| # | Nama Kolom | Tipe Data | Deskripsi |
|---|---|---|---|
| **1** | **No** | Angka | Nomor urut kontrak (1, 2, 3, ...) |
| **2** | **Konsumen** | Teks | Nama customer/pelanggan pemilik kontrak |
| **3** | **Kode Kontrak** | Teks | Kode referensi kontrak (e.g., KT-2026-001) |
| **4** | **Pembayaran ke** | Teks | Range pembayaran yang dikumpulkan (e.g., "1-5" atau "10") — menunjukkan angsuran ke berapa |
| **5** | **Jumlah Kupon** | Angka | Total kupon yang diserahkan untuk kontrak ini |
| **6** | **Kupon Dibayar** | Angka | Jumlah kupon dari range yang sudah dibayarkan |
| **7** | **Angsuran/Kupon (Rp)** | Currency | Nominal per kupon/angsuran harian (e.g., Rp 50,000) |
| **8** | **Total Tertagih (Rp)** | Currency | Total nominal = Kupon Dibayar × Angsuran per Kupon |
| **9** | **Status** | Badge (warna) | Status kontrak dengan warna latar: |

### Status & Warna
| Status | Warna | Arti |
|---|---|---|
| **Lancar** | 🟢 Hijau (#C6EFCE) | Pembayaran sesuai jadwal |
| **Kurang Lancar** | 🟡 Kuning (#FFEB9C) | Pembayaran terlambat tapi masih aktif |
| **Macet** | 🔴 Merah (#FFC7CE) | Pembayaran terputus/sangat terlambat |
| **Macet (Return)** | 🔴 Merah (#FFC7CE) | Kontrak dikembalikan/gagal |
| **Lunas** | 🔵 Biru (#BDD7EE) | Kontrak sudah selesai pembayaran |

### Subtotal Row
Di akhir detail per kolektor, ada baris **TOTAL** yang merupakan penjumlahan otomatis:
- Formula: `SUM()` untuk kolom Jumlah Kupon, Kupon Dibayar, dan Total Tertagih
- Style: Background hijau muda (#E8F5E9), text bold

### Info Header
Setiap sheet per-kolektor memiliki 2 baris header informasi:
1. **Baris 1**: Judul "LAPORAN INPUT PEMBAYARAN - [NAMA KOLEKTOR]" (uppercase)
2. **Baris 2**: `Tanggal: 30 April 2026 | Kolektor: [Nama] ([Kode]) | Jumlah Konsumen: N` ⭐

---

## Penjelasan Logic & Kalkulasi

### Jumlah Konsumen ⭐ (Kolom Baru)
**Cara menghitung:**
1. Lihat semua kontrak yang dipegang kolektor pada tanggal terpilih
2. Hitung unique customer (deduplicate)
3. Prioritas deduplicating:
   - Prefer: `contract.customer_id` (ID unik database)
   - Fallback: `contract_ref` atau `customer_name` (jika customer_id kosong)
4. Hasil: Jumlah customer unik

**Contoh**:
- Jika kolektor mengelola 5 kupon dari 3 customer berbeda
- Kolom "Konsumen" di summary: **3**
- Header per-kolektor: "Jumlah Konsumen: 3"

### Total Kupon
- **Sumber**: `coupon_handovers.coupon_count` (jumlah kupon yang diserahkan dari admin ke kolektor)
- **Perjumlahan**: Sum semua kupon untuk kolektor pada tanggal terpilih

### Kupon Dibayar
- **Sumber**: Range antara `start_index` dan `current_installment_index` kontrak
- **Formula**: `MIN(current_installment_index, handover.end_index) - handover.start_index + 1`
- **Arti**: Berapa banyak kupon dari range yang sudah terbayar sampai hari ini

### Total Tertagih (Rp)
- **Formula**: `Kupon Dibayar × Angsuran per Kupon`
- **Contoh**: 5 kupon × Rp 50,000 = Rp 250,000

---

## Fitur Tambahan

### Auto-filter
- Header detail per kolektor memiliki **filter dropdown** pada setiap kolom
- Memudahkan user untuk filter berdasarkan Status, Konsumen, atau Kode Kontrak

### Lebar Kolom (Detail Sheet)
```
Col 1 (No):              5 cm
Col 2 (Konsumen):       28 cm
Col 3 (Kode Kontrak):   14 cm
Col 4 (Pembayaran ke):  14 cm
Col 5 (Jumlah Kupon):   12 cm
Col 6 (Kupon Dibayar):  14 cm
Col 7 (Angsuran/Kupon): 18 cm
Col 8 (Total Tertagih): 20 cm
Col 9 (Status):         16 cm
```

---

## Summary Ringkas

| Aspek | Detail |
|---|---|
| **Total Kolom (Summary)** | 7 kolom |
| **Total Kolom (Detail)** | 9 kolom |
| **Total Sheet** | 2 sheet (1 Ringkasan + N per-Kolektor) |
| **Format File** | Excel (.xlsx) |
| **Nama File** | `Pembayaran_YYYY-MM-DD_Per_Kolektor.xlsx` |
| **Fitur** | Color coding status, auto-filter, subtotal, currency format |
| **Baru Ditambahkan** | Kolom "Konsumen" (distinct customer count) |

---

## Contoh Data (Ringkasan Sheet)

```
No | Kolektor        | Kode | Konsumen | Total Kupon | Total Dibayar | Total Tertagih
 1 | Budi (K001)     | K001 |    15    |      120    |       85      | Rp 4,250,000
 2 | Rina (K002)     | K002 |     8    |       60    |       45      | Rp 2,250,000
 3 | Ahmad (K003)    | K003 |    12    |      100    |       72      | Rp 3,600,000
```

---

## Contoh Data (Detail Sheet - Kolektor Budi)

```
No | Konsumen       | Kode Kontrak | Pembayaran ke | Jumlah Kupon | Kupon Dibayar | Angsuran | Total Tertagih | Status
 1 | Andi Wijaya    | KT-2026-001  | 1-10          |      10      |       8       | 50,000   | 400,000        | Lancar
 2 | Siti Nurhaliza | KT-2026-005  | 1-5           |       5      |       5       | 50,000   | 250,000        | Lunas
 3 | Reza Pratama   | KT-2026-008  | 15-20         |       6      |       4       | 50,000   | 200,000        | Kurang Lancar
... (lebih banyak baris)
TOTAL                                               |     120      |       85      |          | Rp 4,250,000   |
```

---

## Catatan Teknis

- **Source Data**: `payment_logs` (pembayaran) + `coupon_handovers` (serah terima kupon) + `credit_contracts` (kontrak) + `customers` (pelanggan)
- **Data Filtering**: Hanya menampilkan data yang sesuai dengan `selectedDate`
- **Export Format**: ExcelJS (server-side rendering)
- **User Feedback**: Toast notification sukses/error setelah export

