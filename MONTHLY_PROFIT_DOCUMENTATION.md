# 📅 Keuntungan Harian Per Bulan - Dokumentasi

## 🎯 Deskripsi Fitur

Tab **"Per Bulan"** memungkinkan Anda untuk melihat keuntungan harian dengan visualisasi kalender interaktif dan breakdown per bulan. Fitur ini memberikan perspektif yang lebih jelas tentang tren performa pengumpulan selama sebulan penuh.

## 📍 Lokasi

- **File Komponen**: `/src/components/collection/MonthlyProfitView.tsx`
- **Integrasi**: `/src/pages/Collection.tsx` (Tab kelima)
- **Route**: Collection Page → Tab "Per Bulan"

## ✨ Fitur Utama

### 1. **Navigasi Bulanan**
```
[< ] April 2026 [>]
```
- Tombol prev/next untuk navigasi ke bulan sebelum/sesudah
- Menampilkan bulan dan tahun dengan format lokal (Indonesia)

### 2. **Ringkasan Bulanan (Summary Stats)**

Menampilkan 5 kartu KPI:
- 📊 **Total Kupon**: Jumlah seluruh kupon yang terbayar dalam sebulan
- 📅 **Hari Aktif**: Jumlah hari dengan pembayaran (misal: 22 dari 30 hari)
- 💰 **Total Tertagih**: Nominal total yang terkumpul
- 📈 **Total Profit**: Keuntungan kotor bulan ini
- 💎 **Rata-rata Harian**: Profit dibagi jumlah hari aktif

### 3. **Kalender Interaktif**

```
┌─────────────────────────────────────────┐
│ Min  Sen  Sel  Rab  Kam  Jum  Sab      │
├─────────────────────────────────────────┤
│                              1      2   │
│           [Rp 1.2M]  [Rp 0M]  [Rp 2.5M]│
│           3 kupon    -        5 kupon  │
│                                          │
│ 3 🟢   4 🟡   5 🟡   6 🟢   7 🟢   8 🟡  │
│ ...                                      │
└─────────────────────────────────────────┘
```

**Warna Indikator:**
- 🟢 **Hijau (Bagus)**: Profit ≥ 70% dari maksimum harian bulan itu
- 🟡 **Kuning (Sedang)**: Profit 40-70% dari maksimum harian
- 🔴 **Merah (Rendah)**: Profit < 40% dari maksimum harian
- ⚪ **Abu-abu (Tidak Ada Data)**: Tidak ada pembayaran

**Interaksi:**
- Klik pada tanggal untuk melihat detail pembayaran kontrak
- Hover untuk preview informasi
- Setiap sel menampilkan:
  - Tanggal (angka)
  - Profit (dalam Rupiah, jika ada pembayaran)
  - Jumlah kupon yang terbayar

### 4. **Modal Detail (Klik Tanggal)**

Saat mengklik tanggal, akan muncul dialog dengan:

```
┌──────────────────────────────────┐
│ Detail Keuntungan — 15 April 2026│
├──────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐      │
│  │ Kupon  5 │ │Tertagih  │      │
│  │          │ │Rp 2.5M   │      │
│  └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐      │
│  │ Modal    │ │Profit    │      │
│  │Rp 1.5M   │ │Rp 1M  🟢 │      │
│  └──────────┘ └──────────┘      │
│                                  │
│ Kontrak yang Membayar:           │
│ ┌─────────────────────────────┐ │
│ │ KON-2024-001               │ │
│ │ Ahmad Budi Santoso         │ │
│ │ [2 kupon]  Rp 1M profit   │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ KON-2024-005               │ │
│ │ Siti Aminah                │ │
│ │ [3 kupon]  Rp 500K profit  │ │
│ └─────────────────────────────┘ │
└──────────────────────────────────┘
```

### 5. **Export CSV**

- Tombol di header: `Export CSV`
- Mengexport semua data harian dalam format CSV
- Struktur file:
  ```
  Keuntungan Harian - April 2026
  
  Tanggal,Kupon,Tertagih,Modal,Keuntungan,Margin %
  01 Apr 2026,3,2500000,1500000,1000000,40.00
  02 Apr 2026,0,0,0,0,0
  ...
  TOTAL,85,212500000,127500000,85000000,40.00
  ```

## 📊 Kalkulasi Data

### Per Hari
```
- Coupons_Paid = Total kupon yang dibayar pada tanggal itu
- Collected = Total nominal yang dikumpulkan
- Modal_Portion = Σ(profit_per_coupon) per kontrak
- Profit_Portion = Σ(profit_per_coupon) per kontrak
- Margin = (Profit / Collected) × 100%
```

### Per Bulan
```
- Total_Coupons = Σ(Coupons dari semua hari)
- Total_Collected = Σ(Collected dari semua hari)
- Total_Modal = Σ(Modal dari semua hari)
- Total_Profit = Σ(Profit dari semua hari)
- Active_Days = Jumlah hari dengan profit > 0
- Average_Daily = Total_Profit / Active_Days
- Margin = (Total_Profit / Total_Collected) × 100%
```

### Profit Per Kupon (dari kontrak)
```
Tenor = Jangka waktu kontrak (hari)
Modal_Per_Coupon = Modal_Total / Tenor
Profit_Per_Coupon = (Omset - Modal) / Tenor
```

## 🔧 Technical Implementation

### Dependencies
```typescript
// Date manipulation
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { id } from "date-fns/locale";

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Hooks
import { usePayments } from "@/hooks/usePayments";
import { useContracts } from "@/hooks/useContracts";

// Utils
import { formatRupiah, formatDate } from "@/lib/format";
```

### State Management
```typescript
const [currentDate, setCurrentDate] = useState(new Date());
const [selectedDay, setSelectedDay] = useState<DailyProfit | null>(null);
```

### Data Flow
1. **usePayments()**: Fetch semua pembayaran dalam range bulan
2. **useContracts()**: Fetch info kontrak untuk kalkulasi profit per kupon
3. **contractMap**: Map kontrak dengan detailnya
4. **dailyProfits**: Kalkulasi aggregate per hari
5. **monthlySummary**: Kalkulasi aggregate per bulan

### Performance
- Menggunakan `useMemo` untuk menghindari re-calculation
- Lazy loading saat memilih tanggal
- Modal tidak pre-render sampai dipilih

## 🎨 UI/UX Design

### Color Scheme
- **Primary**: Indigo (action buttons)
- **Success**: Green (profit display)
- **Warning**: Yellow (medium performance)
- **Danger**: Red (low performance)
- **Neutral**: Gray (no data)

### Responsive Design
```
Mobile (<768px):
- Grid 2 kolom untuk summary stats
- Kalender dengan font smaller
- Dialog full-screen

Tablet (768px-1024px):
- Grid 4 kolom untuk summary stats
- Kalender normal
- Dialog modal normal

Desktop (>1024px):
- Grid 5 kolom untuk summary stats
- Kalender dengan hover effects
- Dialog modal dengan max-width
```

### Accessibility
- Semantic HTML tags
- ARIA labels pada icon buttons
- Keyboard navigation (Tab, Enter)
- Color not sole indicator (ada text labels)

## 🚀 Usage

### Import Komponen
```tsx
import { MonthlyProfitView } from "@/components/collection/MonthlyProfitView";

// Dalam Collection.tsx
<TabsContent value="monthly-profit">
  <MonthlyProfitView />
</TabsContent>
```

### Navigasi User
1. Buka halaman **Collection**
2. Klik tab **"Per Bulan"**
3. Gunakan tombol < > untuk navigasi bulan
4. Klik tanggal untuk lihat detail
5. Klik "Export CSV" untuk download data

## 🔒 Data Security

- Hanya menampilkan data pembayaran user yang authorized
- Query payments terbatas pada date range
- Tidak ada modifikasi data (read-only)
- Export CSV tidak menyimpan ke server

## 📈 Future Enhancements

Rekomendasi fitur tambahan:
1. **Chart/Graph**: Line chart trend profit harian
2. **Comparison**: Banding bulan ini vs bulan lalu
3. **Target vs Actual**: Visualisasi target vs realisasi
4. **Agent Performance**: Breakdown per sales agent
5. **Advanced Filters**: Filter by agent, customer, amount range
6. **Forecasting**: Prediksi profit bulan depan
7. **Anomaly Detection**: Alert jika terjadi penurunan drastis
8. **Multiple Exports**: Excel, PDF, JSON formats

## 🐛 Troubleshooting

### Kalender tidak menampilkan data
- Pastikan hook `usePayments` return data dengan benar
- Cek format `payment_date` di database (harus `yyyy-MM-dd`)

### Profit tidak ketemu di contract
- Verifikasi contract mapping bekerja
- Cek console untuk error di data aggregation

### Margin menampilkan NaN
- Terjadi jika `collected = 0` (tidak ada pembayaran)
- Sudah di-handle dengan fallback ke 0

### Export CSV kosong
- Hanya export hari dengan pembayaran
- Jika tidak ada data, export hanya header

## 📝 Changelog

### Version 1.0 (Initial Release)
- ✅ Calendar view dengan color coding
- ✅ Monthly summary stats (5 KPI)
- ✅ Detail modal per tanggal
- ✅ Month navigation
- ✅ CSV export
- ✅ Responsive design
- ✅ Performance optimization dengan useMemo

---

**Status**: Production Ready ✅
**Last Updated**: April 28, 2026
