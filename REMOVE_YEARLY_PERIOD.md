# Hapus Fitur Periode Tahunan pada Sales Agents Page

## Summary
Fitur periode tahunan (yearly) telah dihapus dari halaman Sales Agents. Halaman sekarang hanya mendukung tampilan periode **bulanan** saja.

## Perubahan yang Dilakukan

### 1. File: `src/pages/SalesAgents.tsx`

#### Removed Imports
- Dihapus import `useYearlyFinancialSummary` hook (tidak lagi diperlukan)
- Hook ini telah diganti dengan hanya menggunakan `useMonthlyPerformance`

```tsx
// BEFORE
import { useYearlyFinancialSummary } from '@/hooks/useYearlyFinancialSummary';

// AFTER
// (removed)
```

#### Simplified URL Parameter Handling
- Dihapus parameter URL `period` (sebelumnya bisa 'monthly' | 'yearly')
- Dihapus parameter URL `year` (sebelumnya untuk yearly selection)
- Tetap menggunakan parameter URL `month` untuk monthly selection

```tsx
// BEFORE
const periodParam = searchParams.get('period') || 'monthly';
const monthParam = searchParams.get('month');
const yearParam = searchParams.get('year');

const effectiveMonth = monthParam || format(startOfMonth(new Date()), 'yyyy-MM');
const effectiveYear = yearParam || String(new Date().getFullYear());

const selectedMonthForHook = new Date(effectiveMonth);
const selectedYearForHook = new Date(Number(effectiveYear), 0, 1);

// AFTER
const periodParam = 'monthly'; // Always monthly, removed yearly option
const monthParam = searchParams.get('month');

const effectiveMonth = monthParam || format(startOfMonth(new Date()), 'yyyy-MM');

const selectedMonthForHook = new Date(effectiveMonth);
```

#### Updated Period Range Logic
- Dihapus logika kondisional untuk yearly range
- Hanya menggunakan monthly range calculation

```tsx
// BEFORE
const periodRange = (() => {
  if (periodParam === 'yearly') {
    const y = Number(effectiveYear);
    return { start: `${y}-01-01`, end: `${y}-12-31` };
  }
  const start = format(startOfMonth(selectedMonthForHook), 'yyyy-MM-dd');
  const end = format(new Date(selectedMonthForHook.getFullYear(), selectedMonthForHook.getMonth() + 1, 0), 'yyyy-MM-dd');
  return { start, end };
})();

// AFTER
const periodRange = (() => {
  const start = format(startOfMonth(selectedMonthForHook), 'yyyy-MM-dd');
  const end = format(new Date(selectedMonthForHook.getFullYear(), selectedMonthForHook.getMonth() + 1, 0), 'yyyy-MM-dd');
  return { start, end };
})();
```

#### Removed Hook Usage
- Dihapus pemanggilan `useYearlyFinancialSummary` hook
- Tetap menggunakan `useMonthlyPerformance` hook untuk data

```tsx
// BEFORE
const { data: monthlyData } = useMonthlyPerformance(selectedMonthForHook);
const { data: yearlyFinancial } = useYearlyFinancialSummary(selectedYearForHook as Date);

// AFTER
const { data: monthlyData } = useMonthlyPerformance(selectedMonthForHook);
```

#### Simplified Parameter Synchronization
- Dihapus logika untuk manage `period` dan `year` parameters
- Hanya sync `month` parameter

```tsx
// BEFORE
useEffect(() => {
  const sp = new URLSearchParams(searchParams);
  let needsUpdate = false;

  if (!sp.get('period')) {
    sp.set('period', 'monthly');
    needsUpdate = true;
  }

  if (sp.get('period') === 'monthly' && !sp.get('month')) {
    sp.set('month', format(startOfMonth(new Date()), 'yyyy-MM'));
    sp.delete('year');
    needsUpdate = true;
  }

  if (sp.get('period') === 'yearly' && !sp.get('year')) {
    sp.set('year', String(new Date().getFullYear()));
    sp.delete('month');
    needsUpdate = true;
  }

  if (needsUpdate) {
    setSearchParams(sp, { replace: true });
  }
}, []);

// AFTER
useEffect(() => {
  const sp = new URLSearchParams(searchParams);
  let needsUpdate = false;

  if (sp.get('period')) {
    sp.delete('period');
    needsUpdate = true;
  }

  if (sp.get('year')) {
    sp.delete('year');
    needsUpdate = true;
  }

  if (!sp.get('month')) {
    sp.set('month', format(startOfMonth(new Date()), 'yyyy-MM'));
    needsUpdate = true;
  }

  if (needsUpdate) {
    setSearchParams(sp, { replace: true });
  }
}, []);
```

#### Updated `getAgentOmset` Function
- Dihapus logika untuk handle yearly financial data
- Hanya menggunakan monthly data dari `monthlyData` hook

```tsx
// BEFORE
let periodRecord: any = undefined;
if (periodParam === 'monthly' && monthlyData?.agents) {
  periodRecord = monthlyData.agents.find(...);
} else if (periodParam === 'yearly' && yearlyFinancial?.agents) {
  periodRecord = yearlyFinancial.agents.find(...);
}

// AFTER
let periodRecord: any = undefined;
if (monthlyData?.agents) {
  periodRecord = monthlyData.agents.find(...);
}
```

#### Removed Period Control Functions
- Dihapus function `setPeriod()` (tidak lagi diperlukan untuk switch antara monthly/yearly)
- Dihapus function `shiftYear()` (tidak lagi diperlukan untuk navigate antar tahun)
- Tetap menggunakan function `shiftMonth()` untuk navigate antar bulan

```tsx
// BEFORE
const setPeriod = (p: 'monthly' | 'yearly') => { ... };
const shiftMonth = (delta: number) => { ... };
const shiftYear = (delta: number) => { ... };

// AFTER
const shiftMonth = (delta: number) => { ... };
```

#### Simplified Period Labels
- Dihapus logika kondisional untuk yearly labels
- Hanya menggunakan monthly labels

```tsx
// BEFORE
const periodLabel = periodParam === 'yearly'
  ? `Tahun ${effectiveYear}`
  : `${format(selectedMonthForHook, 'MMMM yyyy', { locale: idLocale })} (reset tgl 1)`;
const omsetColLabel = periodParam === 'yearly'
  ? `Omset ${effectiveYear}`
  : `Omset ${format(selectedMonthForHook, 'MMM yyyy', { locale: idLocale })}`;
const commissionColLabel = periodParam === 'yearly'
  ? `Komisi ${effectiveYear}`
  : `Komisi ${format(selectedMonthForHook, 'MMM yyyy', { locale: idLocale })}`;

// AFTER
const periodLabel = `${format(selectedMonthForHook, 'MMMM yyyy', { locale: idLocale })} (reset tgl 1)`;
const omsetColLabel = `Omset ${format(selectedMonthForHook, 'MMM yyyy', { locale: idLocale })}`;
const commissionColLabel = `Komisi ${format(selectedMonthForHook, 'MMM yyyy', { locale: idLocale })}`;
```

#### Updated Period Selector UI
- **Dihapus**: Tombol "Tahunan" (yearly button)
- **Dihapus**: Logika conditional untuk show/hide month vs year navigation
- **Tetap**: Tombol month navigation (previous/next)
- **Tetap**: Tombol "Bulan Ini" (today button)
- **Updated**: Label dari "Periode:" menjadi "Periode Bulanan:"

```tsx
// BEFORE
<div className="flex gap-1">
  <Button
    variant={periodParam === 'monthly' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setPeriod('monthly')}
  >
    Bulanan
  </Button>
  <Button
    variant={periodParam === 'yearly' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setPeriod('yearly')}
  >
    Tahunan
  </Button>
</div>
<div className="flex items-center gap-1 ml-2">
  <Button variant="outline" size="icon" onClick={() => periodParam === 'yearly' ? shiftYear(-1) : shiftMonth(-1)}>
    <ChevronLeft className="h-4 w-4" />
  </Button>
  ...
  <Button variant="outline" size="icon" onClick={() => periodParam === 'yearly' ? shiftYear(1) : shiftMonth(1)}>
    <ChevronRight className="h-4 w-4" />
  </Button>
</div>

// AFTER
<div className="flex items-center gap-1">
  <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)}>
    <ChevronLeft className="h-4 w-4" />
  </Button>
  ...
  <Button variant="outline" size="icon" onClick={() => shiftMonth(1)}>
    <ChevronRight className="h-4 w-4" />
  </Button>
</div>
```

#### Simplified Help Text
- Dihapus conditional text untuk yearly explanation
- Tetap hanya monthly explanation

```tsx
// BEFORE
<p className="text-xs text-muted-foreground ml-auto">
  {periodParam === 'monthly'
    ? 'Omset, komisi & jumlah pelanggan baru/lama mengikuti bulan terpilih (reset tiap tgl 1)'
    : 'Akumulasi omset, komisi & pelanggan sepanjang tahun yang dipilih'}
</p>

// AFTER
<p className="text-xs text-muted-foreground ml-auto">
  Omset, komisi & jumlah pelanggan baru/lama mengikuti bulan terpilih (reset tiap tgl 1)
</p>
```

#### Updated Export Period Label
- Dihapus logika untuk generate yearly label
- Hanya menggunakan monthly format untuk export

```tsx
// BEFORE
const exportPeriodLabel = periodParam === 'yearly'
  ? `Tahun ${effectiveYear}`
  : format(selectedMonthForHook, 'MMMM yyyy', { locale: idLocale });

// AFTER
const exportPeriodLabel = format(selectedMonthForHook, 'MMMM yyyy', { locale: idLocale });
```

#### Updated Export Filename
- Dihapus logika conditional untuk filename
- Hanya menggunakan month sebagai period slug

```tsx
// BEFORE
const periodSlug = periodParam === 'yearly' ? effectiveYear : effectiveMonth;

// AFTER
const periodSlug = effectiveMonth;
```

## Impact Analysis

### ✅ What Works the Same
- Monthly period selection dan navigation (unchanged)
- Monthly omset & komisi calculation (uses `useMonthlyPerformance`)
- Customer counts filtering (uses `useAgentCustomerCounts`)
- Excel export functionality (simplified, now only monthly)
- Commission tiers management (unchanged)
- Search dan pagination (unchanged)

### ❌ What's Removed
- Tombol "Tahunan" (yearly toggle button)
- Navigasi tahun (year navigation)
- Fitur yearly omset aggregation (accumulation across full year)
- Fitur yearly komisi calculation (tier-based for full year)
- Hook `useYearlyFinancialSummary` (no longer imported)
- URL parameters: `period`, `year`

### 🔄 Simplified Components
- Period selector UI (removed yearly option)
- Period range calculation
- Export period label generation
- URL parameter synchronization
- Period navigation logic

## Code Quality Changes

### Code Reduction
- **Removed**: ~60 lines of yearly-specific logic
- **Simplified**: URL parameter handling
- **Simplified**: Period range calculation
- **Simplified**: Export label generation
- **Result**: Cleaner, more maintainable code

### No Breaking Changes
- All existing monthly functionality preserved
- Component still exports Excel reports (monthly only)
- All hooks and utilities continue to work
- Customer counts still calculated correctly
- Commission tier logic unchanged

## Testing Recommendations

1. **Period Navigation**: Verify month navigation buttons work correctly
   - Previous month (chevron left)
   - Next month (chevron right)
   - Today button (current month)

2. **Data Display**: Check monthly data displays correctly
   - Omset values for current month
   - Komisi calculations match tier settings
   - Customer counts (baru/lama) are accurate

3. **URL Parameters**: Verify URL sync behavior
   - Month parameter is set when navigating
   - Old `period` and `year` parameters are cleaned up
   - URL reflects current month selection

4. **Excel Export**: Test export functionality
   - Export generates file with correct month
   - All agent details included
   - Omset and komisi values match UI

5. **Edge Cases**: Check boundary conditions
   - Navigation to first month of year
   - Navigation to last month of year
   - Export from different months

## Migration Notes

### No Database Changes Required
- No changes to `useMonthlyPerformance` hook
- No changes to `useAgentCustomerCounts` hook
- No changes to `useCommissionTiers` hook
- `useYearlyFinancialSummary` hook no longer used but still exists

### No API Changes Required
- All existing API endpoints still used
- Data queries unchanged
- Filter logic unchanged

### No Configuration Changes Required
- No environment variable changes
- No configuration file updates
- Settings remain same

## Future Considerations

If yearly view is needed again in the future:
1. Yearly calculations should use same tier-based approach as monthly
2. Should aggregate monthly data, not calculate separately
3. `useYearlyFinancialSummary` hook may need refactoring for consistency
4. UI components will need to be updated to support period toggle

---

**Date**: May 3, 2026
**Type**: Feature Removal
**Status**: ✅ Complete & Verified (No TypeScript Errors)
