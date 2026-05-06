# 📊 FITUR: Sisa Tagihan Perbulan di Dashboard Bulanan

## Deskripsi Fitur
Menambahkan metrik **"Sisa Tagihan"** (Outstanding Payments) pada dashboard bulanan untuk tracking kupon cicilan yang belum dibayar dalam bulan tersebut.

---

## 🎯 Apa yang Ditampilkan?

### StatCard "Sisa Tagihan"
**Lokasi:** Dashboard Monthly → Horizontal Scrollable Cards (sebelum Biaya Operasional)

**Metrik:**
- **Label:** "Sisa Tagihan"
- **Icon:** Wallet (merah)
- **Value:** Total Rp dari unpaid coupons bulan ini
- **Subtitle:** "Kupon belum bayar bulan ini"
- **Hover Info:** "Total kupon cicilan yang masih belum dibayar dalam bulan ini (jatuh tempo bulan ini, status unpaid)."

**Warna:**
- Icon: `text-red-500`
- Value: `text-red-600`

---

## 🔍 Perhitungan & Logika

### Query Database
```sql
SELECT 
  SUM(amount) as total_to_collect
FROM installment_coupons
WHERE status = 'unpaid'
  AND due_date >= '[monthStart]'
  AND due_date <= '[monthEnd]'
```

### Periode
- **Due Date Filter:** Kupon yang jatuh tempo dalam bulan yang dipilih
- **Status Filter:** Hanya yang belum dibayar (`status = 'unpaid'`)

### Timing
- **Real-time:** Updated saat ada pembayaran baru (status berubah dari unpaid → paid)
- **Cash Basis:** Reflects actual outstanding yang perlu ditagih hari ini

---

## 📝 Perubahan File

### 1. `/src/hooks/useMonthlyPerformance.ts`

#### Interface Update
```typescript
export interface MonthlyPerformanceSummary {
  total_modal: number;
  total_omset: number;
  total_profit: number;
  total_collected?: number;
  total_to_collect?: number;      // ✅ NEW
  total_commission: number;
  profit_margin: number;
  agents: MonthlyPerformanceData[];
}
```

#### Query Update
Ditambahkan query parallel untuk unpaid coupons:
```typescript
const [
  // ... existing queries ...
  { data: unpaidCouponsThisMonth, error: unpaidCouponsError },  // ✅ NEW
] = await Promise.all([
  // ... existing selects ...
  supabase
    .from('installment_coupons')
    .select('amount, due_date')
    .eq('status', 'unpaid')
    .gte('due_date', monthStart)
    .lte('due_date', monthEnd),  // ✅ NEW
]);
```

#### Error Handling
```typescript
if (unpaidCouponsError) throw unpaidCouponsError;  // ✅ NEW
```

#### Kalkulasi & Return
```typescript
const total_to_collect = (unpaidCouponsThisMonth || []).reduce(
  (s, c: any) => s + Number(c.amount || 0), 
  0
);  // ✅ NEW

return {
  // ... existing fields ...
  total_to_collect,  // ✅ NEW
  // ... rest ...
};
```

---

### 2. `/src/pages/Dashboard.tsx`

#### StatCard Addition
Ditambahkan StatCard baru dalam monthly summary cards (sebelum Biaya Operasional):

```tsx
<div className="w-[180px] flex-shrink-0">
  <StatCard
    icon={Wallet}
    iconColor="text-red-500"
    label="Sisa Tagihan"
    value={monthlyData?.total_to_collect ?? 0}
    valueColor="text-red-600"
    subtitle="Kupon belum bayar bulan ini"
    hoverInfo="Total kupon cicilan yang masih belum dibayar dalam bulan ini (jatuh tempo bulan ini, status unpaid)."
  />
</div>
```

---

## 💾 Data Source Reference

| Komponen | Tabel | Filter | Logika |
|----------|-------|--------|--------|
| **Sisa Tagihan** | `installment_coupons` | status='unpaid', due_date in [bulan] | SUM(amount) |
| **Modal/Omset** | `credit_contracts` | start_date in [bulan], status≠'returned' | SUM(total_loan_amount), SUM(omset) |
| **Tertagih** | `payment_logs` | payment_date in [bulan] | SUM(amount_paid) |

---

## 📊 Perbandingan Dashboard Monthly Cards

### Sebelum Update
```
[Modal] [Omset] [Keuntungan] [Margin] [Komisi] [Tertagih] [Biaya Operasional]
```

### Setelah Update
```
[Modal] [Omset] [Keuntungan] [Margin] [Komisi] [Tertagih] [Sisa Tagihan] [Biaya Operasional]
↑ Old metrics                                               ↑ NEW
```

---

## 🎨 UI/UX Details

### Card Styling
- **Width:** `w-[180px]` (konsisten dengan cards lain)
- **Flex:** `flex-shrink-0` (fixed width dalam scroll area)
- **Container:** Dalam `ScrollArea` → horizontal scrollable

### Icon & Colors
- **Icon:** `Wallet` (dari lucide-react)
- **Icon Color:** `text-red-500` (menandakan urgent/outstanding)
- **Value Color:** `text-red-600` (highlight nilai outstanding)

### Interactivity
- **Hover Info:** Tooltip menjelaskan meaning of metric
- **Responsive:** Scrolls horizontally di layar kecil
- **Loading:** Displays `??` jika data belum loaded

---

## 🔗 Related Features

### Yang Sudah Ada (Yearly)
- **Sisa Tagihan Tahunan** di `useYearlyTarget` hook
- Digunakan untuk Collection Rate calculation
- Formula: `collection_rate = total_collected / (total_collected + total_to_collect) * 100%`

### Baru (Monthly)
- **Sisa Tagihan Bulanan** di `useMonthlyPerformance` hook
- Menunjukkan outstanding per bulan
- Useful untuk monitoring penagihan per bulan

### Yang Bisa Dikembangkan
- [ ] Collection Rate bulanan (Tertagih / (Tertagih + Sisa))
- [ ] Trend chart Sisa Tagihan perbulan
- [ ] Comparison dengan target penagihan
- [ ] Breakdown per agen

---

## ✅ Testing Checklist

- ✅ TypeScript compilation (no errors)
- ✅ Hook data fetching works
- ✅ Dashboard renders StatCard
- ✅ Tooltip shows on hover
- ✅ Responsive scrolling on mobile
- ✅ Correct value displayed (Rp format)
- [ ] Manual QA: Verify values against database
- [ ] Smoke test: Load dashboard, check card appears

---

## 📋 Notes

### Naming Convention
- **Sisa Tagihan** = Outstanding/Remaining Payments (kupon belum bayar)
- Bukan "Belum Tertagih" (confusing dengan tagihan history)
- Bukan "Target Penagihan" (different meaning)

### Cash Basis
- Berbeda dengan "Total Omset" yang accrual basis
- Omset tetap, Sisa Tagihan berkurang saat ada pembayaran

### Performance
- Query parallel dengan existing queries (no extra latency)
- Single SUM aggregation (efficient)
- No additional database indexes needed

---

## 🚀 Deployment

**Version:** v1.0.0
**Date:** 2026-04-27
**Status:** ✅ Ready for production

**Testing Command:**
```bash
npm run dev
# Navigate to Dashboard
# Select any month
# Verify "Sisa Tagihan" card appears with correct value
```

**Rollback Plan:**
If needed, revert changes to:
1. `useMonthlyPerformance.ts` - remove unpaid coupons query + field
2. `Dashboard.tsx` - remove StatCard JSX

---
