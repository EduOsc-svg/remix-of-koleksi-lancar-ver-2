# 📸 Visual Guide - Keuntungan Harian Per Bulan

## 🎯 Overview

Berikut adalah panduan visual lengkap tentang tampilan dan fitur tab "Per Bulan" di halaman Collection.

---

## 1️⃣ HEADER & NAVIGATION

### Layout Header
```
╔════════════════════════════════════════════════════════════╗
║ 📅 Keuntungan Harian Per Bulan              [📥 Export CSV] ║
║ Visualisasi keuntungan harian dengan breakdown             ║
║ per tanggal dan kontrak                                    ║
╠════════════════════════════════════════════════════════════╣
║              [<] April 2026 [>]                           ║
╚════════════════════════════════════════════════════════════╝
```

### Month Navigation
- Tombol `<` navigasi ke bulan sebelumnya
- Tombol `>` navigasi ke bulan berikutnya
- Menampilkan bulan dan tahun dengan format lokal
- Contoh: "April 2026", "May 2026", "June 2026"

---

## 2️⃣ MONTHLY SUMMARY STATS

### Five KPI Cards Layout (Desktop - 5 kolom)

```
┌──────────────────────────────────────────────────────────────────┐
│
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  │ 📦 Kupon    │  │ 📅 H.Aktif  │  │ 💰 Tertagih │
│  │ Total       │  │ dari        │  │ Total       │
│  │ 245         │  │ 22  / 30    │  │ Rp 245 M    │
│  │             │  │ hari        │  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘
│
│  ┌─────────────┐  ┌─────────────┐
│  │ 📈 Profit   │  │ 💎 Rata-rata│
│  │ Total       │  │ Harian      │
│  │ Rp 98 M 🟢  │  │ Rp 4.4 M    │
│  │ Margin 40%  │  │ (Rp 98M ÷ 22)
│  └─────────────┘  └─────────────┘
│
└──────────────────────────────────────────────────────────────────┘
```

### Responsive Variations

**Mobile (<768px)** - Grid 2 kolom:
```
┌──────────────┐  ┌──────────────┐
│ 📦 Kupon 245 │  │ 📅 H.Aktif22 │
└──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐
│ 💰 Rp 245 M  │  │ 📈 Rp 98 M   │
└──────────────┘  └──────────────┘
┌──────────────┐
│ 💎 Rp 4.4 M  │
└──────────────┘
```

**Tablet (768px-1024px)** - Grid 4 kolom:
```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ 📦 245   │  │ 📅 22/30 │  │ 💰 245M  │  │ 📈 98M  │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
┌──────────┐
│ 💎 4.4M  │
└──────────┘
```

---

## 3️⃣ CALENDAR INTERACTIVE VIEW

### Full Calendar Grid

```
╔══════════════════════════════════════════════════════════╗
║ Kalender Keuntungan Harian                              ║
║ Klik tanggal untuk detail kontrak yang membayar         ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║ Legend:                                                  ║
║ ■ Hijau (70%+)  ■ Kuning (40-70%)  ■ Merah (<40%)      ║
║ ■ Abu-abu (Tidak Ada)                                   ║
║                                                          ║
║ Min   Sen   Sel   Rab   Kam   Jum   Sab                ║
╠══════════════════════════════════════════════════════════╣
║                                   1 🟢    2 🟡           ║
║                         Rp 1.2M    Rp 0                 ║
║                         3 kupon    -                    ║
║                                                          ║
║  3 🟡    4 🟡    5 🟢    6 🟢    7 🟢    8 🟡    9 🟢   ║
║ Rp2.1M  Rp1.8M  Rp5.2M  Rp3.1M  Rp2.8M  Rp1.5M  Rp4.3M ║
║ 4 kupon 3 kpn  5 kupon 6 kupon 4 kupon 2 kupon 5 kupon ║
║                                                          ║
║ 10 🟡  11 🟢  12 🟢  13 🟡  14 ⚪  15 🟢  16 🟢        ║
║ Rp2.2M  Rp6M   Rp4.5M  Rp2.9M   -   Rp5.1M  Rp3.8M    ║
║ 3 kpn  7 kupon 5 kupon 4 kupon      6 kupon 5 kupon   ║
║                                                          ║
║ 17 🟢  18 ⚪  19 🟡  20 🟡  21 🔴  22 🟡  23 🟢        ║
║ Rp3.6M   -    Rp1.9M  Rp2.3M  Rp0.8M  Rp2.1M  Rp4.2M   ║
║ 5 kupon      3 kupon 4 kupon 1 kupon 3 kupon 5 kupon  ║
║                                                          ║
║ 24 🟢  25 🟡  26 ⚪  27 🟢  28 🟢  29 🟡  30 🟢        ║
║ Rp5.3M  Rp2.4M   -    Rp4.7M  Rp3.9M  Rp2.5M  Rp6M    ║
║ 6 kupon 3 kupon      5 kupon 5 kupon 4 kupon 7 kupon  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

### Color Coding Explanation

```
🟢 GREEN (Bagus - 70%+)
   - Profit ≥ 70% dari max daily profit bulan itu
   - Contoh: Jika max daily = Rp 6M, maka ≥ Rp 4.2M = Hijau
   - Indikasi: Hari yang sangat produktif

🟡 YELLOW (Sedang - 40-70%)
   - Profit 40-70% dari max daily profit
   - Contoh: Rp 2.4M - Rp 4.2M = Kuning
   - Indikasi: Hari yang cukup produktif

🔴 RED (Rendah - <40%)
   - Profit < 40% dari max daily profit
   - Contoh: < Rp 2.4M = Merah
   - Indikasi: Hari dengan performa rendah

⚪ GRAY (Tidak Ada Data)
   - Tidak ada pembayaran pada tanggal tersebut
   - Indikasi: Hari libur atau tidak ada yang bayar
```

### Interactive Behavior

**Hover State (Desktop)**:
```
┌─────────────────┐
│ 15 🟢           │
│ Rp 5.1M         │ ← Background lebih terang (hover effect)
│ 6 kupon         │   Border berubah menjadi primary color
└─────────────────┘
   Cursor: pointer
   Tooltip muncul (optional)
```

**Click Behavior**:
- Dialog modal terbuka dengan detail pembayaran tanggal tersebut
- Background menjadi semi-transparent (overlay)
- Modal menampilkan breakdown per kontrak

---

## 4️⃣ DETAIL MODAL (Saat Klik Tanggal)

### Modal Header
```
┌────────────────────────────────────────┐
│ Detail Keuntungan — 15 April 2026  [X] │
└────────────────────────────────────────┘
  Rincian per kontrak yang membayar pada tanggal ini
```

### Summary Grid (4 Cards)
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Kupon           │ Tertagih        │ Modal           │ Profit          │
│ 6               │ Rp 3.05 M       │ Rp 1.83 M       │ Rp 1.22 M 🟢    │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### Contracts List
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Kontrak yang Membayar:

  ┌────────────────────────────────────────────────────────┐
  │ KON-2024-001                                           │
  │ Ahmad Budi Santoso                         [2 kupon]   │
  │                                                        │
  │ Tertagih:                  Profit:                     │
  │ Rp 1.01 M                  Rp 610.5K                   │
  └────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────┐
  │ KON-2024-005                                           │
  │ Siti Aminah                                [3 kupon]   │
  │                                                        │
  │ Tertagih:                  Profit:                     │
  │ Rp 1.52 M                  Rp 611.5K                   │
  └────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────┐
  │ KON-2024-008                                           │
  │ Budi Hartono                               [1 kupon]   │
  │                                                        │
  │ Tertagih:                  Profit:                     │
  │ Rp 520K                    Rp -                        │
  └────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 5️⃣ EXPORT FUNCTIONALITY

### Export Button
```
┌─────────────────────────────────────────────────────┐
│ 📅 Keuntungan Harian Per Bulan  [📥 Export CSV]    │
│                                 └─────────────────┘ ← Click here
└─────────────────────────────────────────────────────┘
```

### Generated CSV File

**File name**: `keuntungan-harian-2026-04.csv`

**Content Preview**:
```
Keuntungan Harian - April 2026

Tanggal,Kupon,Tertagih,Modal,Keuntungan,Margin %
01 Apr 2026,3,2500000,1500000,1000000,40.00
02 Apr 2026,0,0,0,0,0.00
03 Apr 2026,4,2100000,1260000,840000,40.00
04 Apr 2026,3,1800000,1080000,720000,40.00
05 Apr 2026,5,2650000,1590000,1060000,40.00
...
14 Apr 2026,0,0,0,0,0.00
15 Apr 2026,6,3050000,1830000,1220000,40.00
...
30 Apr 2026,7,3710000,2226000,1484000,40.00

TOTAL,85,212500000,127500000,85000000,40.00
```

**Format Features**:
- Header dengan bulan/tahun
- Separator kosong untuk readability
- Hanya hari dengan pembayaran yang di-export
- Total row di akhir
- Format Rupiah sebagai number (bukan string)
- Margin % dengan 2 decimal

---

## 6️⃣ RESPONSIVE DESIGN

### Mobile Layout (< 768px)

```
╔════════════════════════╗
║ 📅 Keuntungan Harian   ║
║ Per Bulan              ║
║            [📥 Export] ║
╠════════════════════════╣
║       [< April >]      ║
╠════════════════════════╣
║ ┌────────────────────┐ ║
║ │ 📦 Kupon    245    │ ║
║ └────────────────────┘ ║
║ ┌────────────────────┐ ║
║ │ 📅 H.Aktif   22/30 │ ║
║ └────────────────────┘ ║
║ ┌────────────────────┐ ║
║ │ 💰 Tertagih 245 M  │ ║
║ └────────────────────┘ ║
║ ┌────────────────────┐ ║
║ │ 📈 Profit    98 M  │ ║
║ └────────────────────┘ ║
║ ┌────────────────────┐ ║
║ │ 💎 Rata-rata 4.4 M │ ║
║ └────────────────────┘ ║
║                        ║
║ Min Sen Sel Rab Kam    ║
║ Jum Sab                ║
║                        ║
║  1  2  3  4  5  6  7   ║
║  8  9 10 11 12 13 14   ║
║ 15 16 17 18 19 20 21   ║
║ 22 23 24 25 26 27 28   ║
║ 29 30                  ║
║                        ║
╚════════════════════════╝
```

### Tablet Layout (768px - 1024px)

```
╔═══════════════════════════════════════════╗
║ 📅 Keuntungan Harian Per Bulan             ║
║                          [📥 Export CSV]  ║
╠═══════════════════════════════════════════╣
║            [< April 2026 >]               ║
╠═══════════════════════════════════════════╣
║ ┌──────────┐ ┌──────────┐ ┌──────────┐   ║
║ │ 📦 Kupon │ │ 📅 Aktif │ │ 💰 Total │   ║
║ │   245    │ │ 22 / 30  │ │ 245 M    │   ║
║ └──────────┘ └──────────┘ └──────────┘   ║
║ ┌──────────┐ ┌──────────┐                ║
║ │ 📈 Profit│ │ 💎 Avg   │                ║
║ │ 98 M 🟢  │ │ 4.4 M    │                ║
║ └──────────┘ └──────────┘                ║
║                                           ║
║ Min  Sen  Sel  Rab  Kam  Jum  Sab        ║
║                                           ║
║  1🟢  2🟡  3🟡  4🟢  5🟢  6🟡  7🟢       ║
║ 1.2M 0    2.1M 1.8M 5.2M 3.1M 2.8M      ║
║ 3kpn -    4kpn 3kpn 5kpn 6kpn 4kpn      ║
║                                           ║
║  8🟡  9🟢 10🟢 11🟡 12⚪ 13🟢 14🟢       ║
║ 1.5M 4.3M 2.2M 6M   4.5M 2.9M -         ║
║ 2kpn 5kpn 3kpn 7kpn 5kpn 4kpn -         ║
║                                           ║
║ ...                                      ║
╚═══════════════════════════════════════════╝
```

---

## 7️⃣ KEYBOARD NAVIGATION

```
Tab → Navigate antara tombol dan kalender
Enter → Pilih tanggal / Buka modal
Esc → Close modal
Arrow Keys → Navigate bulan (optional enhancement)
```

---

## 8️⃣ STATE TRANSITIONS

### 1. Initial Load
```
Loading State:
┌────────────────────────────────────────┐
│ 🔄 Memuat data...                      │
│                                        │
│ (Skeletons atau spinner)               │
└────────────────────────────────────────┘
```

### 2. Data Loaded (No Payments)
```
Empty State:
┌────────────────────────────────────────┐
│ 📅 Keuntungan Harian - April 2026      │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ ⓘ Tidak ada data pembayaran      │  │
│ │ pada bulan ini                   │  │
│ └──────────────────────────────────┘  │
│                                        │
│ Semua summary stats = 0                │
│ Kalender semua abu-abu                 │
└────────────────────────────────────────┘
```

### 3. Data Loaded (With Payments)
```
Full State:
(Seperti tampilan normal di atas)
```

### 4. Modal Open
```
┌─────────────────────────────────────────────────┐
│ ░░░░░ Modal Overlay (semi-transparent) ░░░░░░  │
│                                                 │
│     ┌────────────────────────────────┐          │
│     │ Detail Keuntungan - 15 Apr     │          │
│     │ (Modal Content)                │          │
│     │                                │          │
│     │                                │          │
│     └────────────────────────────────┘          │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 9️⃣ PERFORMANCE INDICATORS

### Before (Daily Only)
```
Hanya melihat 1 hari:
- Input date picker
- Tabel detail per kontrak
- Tidak bisa lihat trend bulan
```

### After (Monthly Overview)
```
Bisa lihat seluruh bulan:
- Visual kalender dengan color coding
- Monthly summary stats
- Trend visibility
- Easy drill-down untuk detail per hari
- Export untuk analysis
```

---

## 🔟 ACCESSIBILITY

### Screen Reader Text
```
Calendar day button:
"15 April, profit Rp 5.1 juta, 6 kupon, status bagus"

Stats card:
"Total keuntungan bulan ini: Rp 98 juta"

Export button:
"Export data keuntungan harian April 2026 sebagai CSV"
```

---

## 11️⃣ ERROR STATES

### Network Error
```
╔════════════════════════════════════════╗
║ ⚠️ Gagal memuat data                   ║
║ Periksa koneksi internet Anda          ║
║                      [🔄 Retry]       ║
╚════════════════════════════════════════╝
```

### No Contracts
```
╔════════════════════════════════════════╗
║ ℹ️ Tidak ada kontrak aktif             ║
║ Tidak ada data keuntungan untuk        ║
║ ditampilkan                            ║
╚════════════════════════════════════════╝
```

---

**End of Visual Guide** ✅
