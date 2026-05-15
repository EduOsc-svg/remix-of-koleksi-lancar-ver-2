# Penjelasan Kolom "Pembayaran ke" - Laporan Input Pembayaran Per Kolektor

## Definisi Singkat

**Kolom "Pembayaran ke"** menampilkan **range angsuran yang telah dikumpulkan kolektor** untuk setiap kontrak pada tanggal pelaporan.

Acuannya adalah: **Kupon yang telah dibayar** (berdasarkan `current_installment_index` kontrak).

---

## Logika Perhitungan

### Formula

```
startIndex = handover.start_index          // Angsuran awal yang diserahkan
endIndex = handover.end_index              // Angsuran akhir yang diserahkan
currentIndex = contract.current_installment_index  // Angsuran yang sudah terbayar sampai hari ini

paidInRange = MIN(currentIndex, endIndex) - startIndex + 1
```

### Konteks Coupon Handover

Setiap kali kupon diserahkan ke kolektor, dicatat:
- `handover.start_index` = angsuran ke berapa (mulai dari)
- `handover.end_index` = angsuran ke berapa (sampai)
- `handover.coupon_count` = jumlah kupon (= end_index - start_index + 1)

**Contoh handover:**
```
Kolektor: Budi
Kontrak KT-001: Diserahkan kupon angsuran 1-10 (10 kupon)
Kontrak KT-001: Diserahkan kupon angsuran 11-20 (10 kupon lagi)
```

### Menyesuaikan dengan Progress Pembayaran

Ketika ada pembayaran:
- `contract.current_installment_index` bertambah
- Misalnya: setelah hari 5, sudah ada 7 pembayaran masuk → `current_installment_index = 7`

---

## Contoh Kasus Nyata

### Kasus 1: Semua Kupon Dalam Range Sudah Terbayar

**Scenario:**
```
Kontrak: KT-001
Customer: Andi Wijaya
Tenor: 60 hari, Rp 50,000 per hari

Handover ke Kolektor Budi pada 30 April 2026:
- start_index = 1
- end_index = 10
- coupon_count = 10

Pembayaran hingga 30 April 2026:
- current_installment_index = 10 (semua 10 kupon sudah dibayar)
```

**Hasil di Laporan:**
```
Pembayaran ke: 1-10
Kupon Dibayar: 10
Total Tertagih: 10 × Rp 50,000 = Rp 500,000
Status: Lancar (jika pembayaran tepat waktu)
```

---

### Kasus 2: Sebagian Kupon Dalam Range Sudah Terbayar

**Scenario:**
```
Kontrak: KT-001 (sama seperti Kasus 1)

Pembayaran hingga 30 April 2026:
- current_installment_index = 7 (baru 7 kupon yang dibayar dari 10 kupon yang diserahkan)
```

**Hasil di Laporan:**
```
Pembayaran ke: 1-10
Kupon Dibayar: 7
Total Tertagih: 7 × Rp 50,000 = Rp 350,000
Status: Lancar (karena 7 dari 10 sudah dibayar)
```

---

### Kasus 3: Multiple Handover - Pembayaran Melebihi Range Pertama

**Scenario:**
```
Kontrak: KT-002
Customer: Siti Nurhaliza

Handover #1 (20 April 2026):
- start_index = 1, end_index = 5 (5 kupon)

Handover #2 (25 April 2026):
- start_index = 6, end_index = 15 (10 kupon)

Pembayaran hingga 30 April 2026:
- current_installment_index = 12 (sudah terbayar 12 angsuran)
```

**Hasil di Laporan (Handover #1):**
```
Pembayaran ke: 1-5
Kupon Dibayar: 5 (MIN(12, 5) - 1 + 1 = 5, semua sudah terbayar)
Total Tertagih: 5 × Rp 50,000 = Rp 250,000
Status: Lunas (range ini selesai)
```

**Hasil di Laporan (Handover #2):**
```
Pembayaran ke: 6-15
Kupon Dibayar: 7 (MIN(12, 15) - 6 + 1 = 7, dari 10 kupon diserahkan)
Total Tertagih: 7 × Rp 50,000 = Rp 350,000
Status: Lancar (masih dalam proses, sudah bayar 7 dari 10)
```

---

### Kasus 4: Belum Ada Pembayaran Sama Sekali

**Scenario:**
```
Kontrak: KT-003
Customer: Reza Pratama

Handover pada 28 April 2026:
- start_index = 1, end_index = 10 (10 kupon)

Pembayaran hingga 30 April 2026:
- current_installment_index = 0 (belum ada pembayaran)
```

**Hasil di Laporan:**
```
Pembayaran ke: 1-10
Kupon Dibayar: 0
Total Tertagih: Rp 0
Status: Macet (tidak ada pembayaran sejak diserahkan)
```

---

### Kasus 5: Single Payment (Bukan Range)

**Scenario:**
```
Kontrak: KT-004

Dari fallback logic (jika data payment langsung, bukan handover):
- Hanya ada 1 pembayaran untuk angsuran ke-25

Maka:
- startIndex = 25
- endIndex = 25
```

**Hasil di Laporan:**
```
Pembayaran ke: 25
Kupon Dibayar: 1
Total Tertagih: 1 × Rp 50,000 = Rp 50,000
Status: Lancar
```

---

## Rumus Display di Excel

```typescript
const range = d.startIndex === d.endIndex 
  ? `${d.startIndex}`           // Tampil: "25"
  : `${d.startIndex}-${d.endIndex}`;  // Tampil: "1-10"
```

**Jadi:**
- Jika `startIndex` sama dengan `endIndex` → tampil angka tunggal (e.g., "25")
- Jika berbeda → tampil range dengan dash (e.g., "1-10")

---

## Interpretasi Kolom "Pembayaran ke"

| Format | Arti |
|---|---|
| **"1-10"** | Kupon angsuran 1 sampai 10 yang diserahkan, dan tracking berapa banyak yang sudah terbayar |
| **"11-20"** | Kupon angsuran 11 sampai 20, tracking pembayaran untuk range ini |
| **"25"** | Hanya 1 kupon untuk angsuran ke-25 (usually dari fallback logic) |
| **"50-60"** | Last batch, angsuran ke-50 sampai ke-60 |

---

## Hubungan dengan Kolom Lain

| Kolom | Data Sumber | Relasi ke "Pembayaran ke" |
|---|---|---|
| **Jumlah Kupon** | `handover.coupon_count` | Jumlah kupon dalam range "Pembayaran ke" |
| **Kupon Dibayar** | `paidInRange = MIN(currentIndex, endIndex) - startIndex + 1` | Berapa banyak dari range yang sudah terbayar |
| **Total Tertagih** | `Kupon Dibayar × dailyAmount` | Total nominal untuk pembayaran dalam range ini |
| **Status** | Ratio pembayaran vs waktu elapsed | Indikator kesehatan pembayaran untuk range ini |

---

## Contoh Tabel Lengkap (Satu Kontrak Multi-Handover)

```
Kontrak: KT-001, Customer: Andi, Tenor: 60 hari, Daily: Rp 50,000

Pembayaran ke | Jumlah Kupon | Kupon Dibayar | Angsuran/Kupon | Total Tertagih | Status
1-10          | 10           | 10            | 50,000         | 500,000        | Lunas
11-20         | 10           | 8             | 50,000         | 400,000        | Lancar
21-30         | 10           | 5             | 50,000         | 250,000        | Kurang Lancar
31-40         | 10           | 0             | 50,000         | 0              | Macet
41-60         | (belum diserahkan)

Subtotal:     | 40           | 23            |                | 1,150,000      |
```

**Interpretasi:**
- Angsuran 1-10 sudah selesai (Lunas)
- Angsuran 11-20 sebagian baru terbayar (Lancar)
- Angsuran 21-30 baru sedikit terbayar (Kurang Lancar)
- Angsuran 31-40 belum ada pembayaran sama sekali (Macet)
- Angsuran 41-60 belum diserahkan ke kolektor

---

## Kesimpulan

**"Pembayaran ke" adalah window/range dari semua kupon yang diserahkan kolektor untuk 1 kontrak**, dan nilai yang ditampilkan adalah:
- **Acuan**: Pembayaran yang telah terjadi (`current_installment_index`)
- **Format**: `startIndex-endIndex` atau single number jika hanya 1 kupon
- **Makna**: "Angsuran ke-X sampai ke-Y yang sudah/sedang dikumpulkan kolektor"

Kolom ini penting untuk **tracking mana saja kupon yang masih outstanding atau sudah tertagih** dari setiap batch handover yang diberikan kepada kolektor.

