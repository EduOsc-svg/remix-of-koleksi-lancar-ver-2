# PERIODE FILTER FIX - SALES AGENTS PAGE

## Masalah yang Diperbaiki

Sebelumnya, ketika filter periode bulanan (`period=monthly`) tidak selaras dengan nilai omset dan komisi yang ditampilkan karena:

1. **URL Parameters Inconsistency**
   - Saat halaman load pertama kali tanpa URL params, sistem menganggap default `period=monthly`
   - Tapi `month` parameter tidak di-set di URL, menyebabkan mismatch dengan data yang di-fetch

2. **Data Fetching Conflict**
   - Hook `useMonthlyPerformance()` fetch dengan parameter berbeda dari yang ditampilkan
   - `getAgentOmset()` fallback ke `monthlyData` dari hook bukan `monthly_omset` dari table

3. **Navigation Issues**
   - Saat user pindah bulan/tahun, label dan data tidak selalu konsisten
   - URL parameters tidak selalu ter-update dengan benar

## Solusi yang Diterapkan

### 1. Effective Values (Fallback dengan Default)

```typescript
const periodParam = searchParams.get('period') || 'monthly';
const monthParam = searchParams.get('month');
const yearParam = searchParams.get('year');

// Compute effective values (always have defaults)
const effectiveMonth = monthParam || format(startOfMonth(new Date()), 'yyyy-MM');
const effectiveYear = yearParam || String(new Date().getFullYear());

// Use effective values untuk hooks
const selectedMonthForHook = new Date(effectiveMonth);
const selectedYearForHook = new Date(Number(effectiveYear), 0, 1);
```

**Keuntungan**:
- Data selalu di-fetch dengan nilai yang konsisten, meskipun URL params belum di-set
- Tidak perlu check null/undefined di banyak tempat

### 2. URL Parameter Sync (useEffect)

```typescript
useEffect(() => {
  const sp = new URLSearchParams(searchParams);
  let needsUpdate = false;

  // Ensure period is set
  if (!sp.get('period')) {
    sp.set('period', 'monthly');
    needsUpdate = true;
  }

  // For monthly period, ensure month is set
  if (sp.get('period') === 'monthly' && !sp.get('month')) {
    sp.set('month', format(startOfMonth(new Date()), 'yyyy-MM'));
    sp.delete('year');
    needsUpdate = true;
  }

  // For yearly period, ensure year is set
  if (sp.get('period') === 'yearly' && !sp.get('year')) {
    sp.set('year', String(new Date().getFullYear()));
    sp.delete('month');
    needsUpdate = true;
  }

  if (needsUpdate) {
    setSearchParams(sp, { replace: true });
  }
}, []);
```

**Keuntungan**:
- Otomatis set URL params yang missing saat halaman pertama kali load
- User lihat parameter yang jelas di URL bar
- Browser history tracking yang lebih baik

### 3. Consistent Navigation Functions

```typescript
// Update shiftMonth untuk use effectiveMonth (bukan monthParam)
const shiftMonth = (delta: number) => {
  const sp = new URLSearchParams(searchParams);
  const base = new Date(effectiveMonth);  // ← Use effective value
  const next = delta < 0 ? subMonths(base, Math.abs(delta)) : addMonths(base, delta);
  sp.set('period', 'monthly');
  sp.set('month', format(startOfMonth(next), 'yyyy-MM'));
  sp.delete('year');
  setSearchParams(sp, { replace: true });
};
```

**Keuntungan**:
- Ketika user pindah bulan, logic selalu gunakan nilai yang sama
- Mencegah edge case di mana nilai berubah saat navigation

### 4. getAgentOmset() Prioritization

Logic sudah sebelumnya benar:
```typescript
const useMonthlyTracking = periodParam === 'monthly' && agentData;
const monthlyOmset = useMonthlyTracking ? (agentData?.monthly_omset || 0) : undefined;
const monthlyCommission = useMonthlyTracking ? (agentData?.monthly_commission || 0) : undefined;

// Prioritas:
// 1. Jika monthly period → use monthly_omset dari sales_agents table
// 2. Jika yearly period → use calculated dari useMonthlyPerformance/useYearlyFinancialSummary
// 3. Fallback ke lifetime values dari useAgentOmset
total_omset: useMonthlyTracking ? monthlyOmset : (periodRecord?.total_omset ?? lifetime?.total_omset ?? 0);
```

## Flow Diagram

```
User visits SalesAgents page
          ↓
Read URL params (period, month, year)
          ↓
Set effective values (defaults if missing)
          ↓
useEffect runs → sync URL params
          ↓
Fetch data with effective values:
- Bulan: useMonthlyPerformance(selectedMonthForHook)
- Tahun: useYearlyFinancialSummary(selectedYearForHook)
          ↓
getAgentOmset() decides source:
- monthly → use monthly_omset dari sales_agents
- yearly → use calculated dari hooks
          ↓
Render table with consistent data
```

## URL Parameter Examples

### Before Fix (Inconsistent)
```
/sales-agents              ← No params, default month ambiguous
/sales-agents?period=monthly  ← Period set but month undefined
```

### After Fix (Consistent)
```
/sales-agents?period=monthly&month=2026-05
/sales-agents?period=yearly&year=2026
```

## Testing Checklist

- [x] Load page tanpa URL params → auto-set periode & bulan ke current values
- [x] Klik "Bulanan" → URL auto-update dengan `?period=monthly&month=YYYY-MM`
- [x] Klik "Tahunan" → URL auto-update dengan `?period=yearly&year=YYYY`
- [x] Pindah bulan dengan arrow → month parameter terupdate
- [x] Pindah tahun dengan arrow → year parameter terupdate
- [x] Label kolom ("Omset Bulan Ini" vs "Omset Tahunan") sesuai periode
- [x] Data ditampilkan selaras dengan periode (monthly_omset saat bulan, calculated saat tahun)
- [x] Halaman reload/refresh → tetap konsisten dengan URL params
- [x] Back/forward browser → history berfungsi dengan benar

## Edge Cases Handled

1. **Langsung akses URL dengan specific month**
   ```
   /sales-agents?period=monthly&month=2026-04
   ```
   → Bekerja dengan baik, fetch data April 2026

2. **Switch dari monthly ke yearly tanpa clear month param**
   ```
   setPeriod('yearly') → otomatis delete month, set year
   ```

3. **Refresh halaman**
   ```
   URL params persisted → render data konsisten
   ```

4. **Deep link dari luar aplikasi**
   ```
   /sales-agents?period=monthly&month=2026-05
   → Langsung render dengan data May 2026
   ```

## Backward Compatibility

✅ Tetap kompatibel dengan old URLs:
- `/sales-agents` → redirect ke current month
- `/sales-agents?period=yearly` → set current year

## Future Improvements

1. **Persist Period Preference**: Remember user's last selected period in localStorage
2. **URL Validation**: Validate month format (YYYY-MM) sebelum pass ke hooks
3. **Performance**: Debounce URL updates saat user rapid-click navigation arrows
