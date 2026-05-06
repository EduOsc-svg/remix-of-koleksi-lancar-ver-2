# Diagram Alur Filter Periode - Sales Agents

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│          USER INTERACTION (Sales Agents Page)           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌──────────────────────────────────────────────┐    │
│   │  Period Selector                             │    │
│   │  ┌──────┬────────┐  ┌─◀─┌─────────┐─▶─┐    │    │
│   │  │Monthly│Yearly │  │  │ Bulan/Th │  │   │    │
│   │  └──────┴────────┘  └─────────────┘   │    │    │
│   │           ↓                            │    │    │
│   └──────────────────────────────────────────────┘    │
│           ↓                                            │
│   setSearchParams(url)                                │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│         URL PARAMETER PARSING & SYNC                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Period Param: 'monthly' | 'yearly'                    │
│  Month Param:  'yyyy-MM' (e.g., '2026-05')             │
│  Year Param:   'yyyy'    (e.g., '2026')                │
│                                                         │
│  useEffect sync → Ensure consistency:                  │
│  ├─ If monthly && !month → set current month           │
│  ├─ If yearly && !year   → set current year            │
│  └─ Clean up unused params                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│    PERIOD RANGE CALCULATION                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  If YEARLY:                                            │
│  ┌─────────────────────────────────────────┐           │
│  │ start = 'yyyy-01-01'                    │           │
│  │ end   = 'yyyy-12-31'                    │           │
│  │ Example: 2026-01-01 to 2026-12-31       │           │
│  └─────────────────────────────────────────┘           │
│                                                         │
│  If MONTHLY:                                           │
│  ┌─────────────────────────────────────────┐           │
│  │ start = '2026-05-01'  (startOfMonth)    │           │
│  │ end   = '2026-05-31'  (endOfMonth)      │           │
│  │ Example: 2026-05-01 to 2026-05-31       │           │
│  └─────────────────────────────────────────┘           │
│                                                         │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│    HOOK CALLS dengan PERIOD RANGE                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────┐               │
│  │ useMonthlyPerformance                │               │
│  │ (selectedMonthForHook)               │               │
│  │ ↓                                     │               │
│  │ Query: start_date BETWEEN            │               │
│  │        2026-05-01 AND 2026-05-31      │               │
│  │ Result: Kontrak dibuat di Mei 2026   │               │
│  └─────────────────────────────────────┘               │
│                                                         │
│  ┌─────────────────────────────────────┐               │
│  │ useYearlyFinancialSummary            │               │
│  │ (selectedYearForHook)                │               │
│  │ ↓                                     │               │
│  │ Query: start_date BETWEEN            │               │
│  │        2026-01-01 AND 2026-12-31      │               │
│  │ Result: Kontrak dibuat di 2026        │               │
│  └─────────────────────────────────────┘               │
│                                                         │
│  ┌─────────────────────────────────────┐               │
│  │ useAgentCustomerCounts               │               │
│  │ (periodRange.start, end)             │               │
│  │ ↓                                     │               │
│  │ Query: start_date BETWEEN            │               │
│  │        [periodRange]                  │               │
│  │ Result: Pelanggan baru/lama di periode│               │
│  └─────────────────────────────────────┘               │
│                                                         │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│    DATA AGGREGATION & DISPLAY                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Per Sales Agent:                                      │
│  ├─ Omset = total_omset dari monthlyData/yearlyData   │
│  ├─ Komisi = total_commission (tier-based)             │
│  ├─ Kontrak = total_contracts di periode               │
│  ├─ B (New) = agentCustomerCounts.baru                 │
│  └─ L (Old) = agentCustomerCounts.lama                 │
│                                                         │
│  Export Excel:                                         │
│  ├─ Sheet 1: Summary semua agen di periode             │
│  ├─ Sheet 2+: Detail per agen (kontrak + omset)        │
│  └─ Period label di title: "Periode Mei 2026"          │
│                                                         │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│          TABLE DISPLAY WITH PERIOD DATA                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Columns:                                              │
│  ┌──────┬────────┬───────┬──────┬─────┬─┬─┬──────┐   │
│  │ Kode │  Nama  │Telepon│Omset │Kom. │B│L│Action│   │
│  │      │        │       │  Mei │ Mei │ │ │      │   │
│  ├──────┼────────┼───────┼──────┼─────┼─┼─┼──────┤   │
│  │ S001 │ Budi   │ 0821… │ 50M  │ 2.5M│3│2│ ... │   │
│  │ S002 │ Dian   │ 0822… │ 75M  │ 3.7M│5│1│ ... │   │
│  │ ...  │ ...    │ ...   │ ...  │ ...│…│…│ ... │   │
│  └──────┴────────┴───────┴──────┴─────┴─┴─┴──────┘   │
│                                                         │
│  Catatan:                                              │
│  - Omset/Komisi = data periode (reset setiap bulan)   │
│  - B/L = pelanggan unik dalam periode                  │
│  - Tidak fallback ke lifetime rolling sum              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Contract Filtering Logic

### Monthly Mode Example

```
Scenario: User memilih Mei 2026
┌──────────────────────────────────────────────┐
│ URL: ?period=monthly&month=2026-05            │
└──────────────────────────────────────────────┘

Period Range: 2026-05-01 to 2026-05-31

Contract Basis Query:
SELECT * FROM credit_contracts
WHERE status != 'returned'
  AND start_date >= '2026-05-01'
  AND start_date <= '2026-05-31'

Results Include:
✓ 2026-05-01  (INCLUDE - in range)
✓ 2026-05-15  (INCLUDE - in range)
✓ 2026-05-31  (INCLUDE - in range)
✗ 2026-04-30  (EXCLUDE - before range)
✗ 2026-06-01  (EXCLUDE - after range)
✗ status='returned' (EXCLUDE - status filter)

Calculation per Agent:
Total Omset = SUM(total_loan_amount) dari kontrak matched
Total Komisi = calculateTieredCommission(total_omset)
Sisa Tagihan = SUM(tenor_days × daily_installment - paid_amount)
Pelanggan Baru = unique customers dengan 1 kontrak lifetime
Pelanggan Lama = unique customers dengan ≥2 kontrak lifetime
```

### Yearly Mode Example

```
Scenario: User memilih 2026
┌──────────────────────────────────────────────┐
│ URL: ?period=yearly&year=2026                 │
└──────────────────────────────────────────────┘

Period Range: 2026-01-01 to 2026-12-31

Contract Basis Query:
SELECT * FROM credit_contracts
WHERE status != 'returned'
  AND start_date >= '2026-01-01'
  AND start_date <= '2026-12-31'

Results Include:
✓ 2026-01-01  (INCLUDE - Jan)
✓ 2026-06-15  (INCLUDE - Jun)
✓ 2026-12-31  (INCLUDE - Dec)
✗ 2025-12-31  (EXCLUDE - prev year)
✗ 2027-01-01  (EXCLUDE - next year)
✗ status='returned' (EXCLUDE - status filter)

Calculation per Agent:
Total Omset = SUM(total_loan_amount) dari semua kontrak tahun itu
Total Komisi = calculateTieredCommission(total_omset tahunan)
Sisa Tagihan = SUM(tenor_days × daily_installment - paid_amount) tahun itu
Pelanggan Baru/Lama = same logic, but with yearly period filter
```

---

## 🔄 State Management Flow

```
┌──────────────────────────┐
│  URL Search Params       │
├──────────────────────────┤
│ ?period=monthly          │
│ &month=2026-05           │
│ &year=                   │
└──────────────────────────┘
         ↓ useSearchParams()
┌──────────────────────────┐
│  Component State         │
├──────────────────────────┤
│ periodParam = 'monthly'  │
│ monthParam = '2026-05'   │
│ yearParam = undefined    │
└──────────────────────────┘
         ↓ Calculate effective values
┌──────────────────────────┐
│  Effective Period        │
├──────────────────────────┤
│ effectiveMonth = '2026-05'
│ effectiveYear = '2026'   │
│ periodRange = {          │
│   start: '2026-05-01',   │
│   end: '2026-05-31'      │
│ }                        │
└──────────────────────────┘
         ↓ Pass to hooks
┌──────────────────────────┐
│  Hooks Query             │
├──────────────────────────┤
│ useMonthlyPerformance()  │
│ useAgentCustomerCounts() │
│ useYearlyFinancialSummary()
└──────────────────────────┘
         ↓ Return period-specific data
┌──────────────────────────┐
│  Display in Table        │
├──────────────────────────┤
│ [May 2026 data only]     │
│ Reset each 1st of month  │
└──────────────────────────┘
```

---

## ✅ Validation Checklist

```
[✓] Parameter initialization
    [✓] periodParam default: 'monthly'
    [✓] monthParam default: current month (yyyy-MM)
    [✓] yearParam default: current year (yyyy)

[✓] Period range calculation
    [✓] Monthly: 1st to last day of month
    [✓] Yearly: Jan 1 to Dec 31
    [✓] Correct date format (yyyy-MM-dd)

[✓] Hook calls
    [✓] monthlyData called when periodParam === 'monthly'
    [✓] yearlyFinancial called when periodParam === 'yearly'
    [✓] periodRange passed to useAgentCustomerCounts()

[✓] Data display
    [✓] Omset shows period data (not lifetime)
    [✓] Commission uses period-specific tier calculation
    [✓] Customer counts (B/L) uses period filter
    [✓] Label shows active period

[✓] Navigation
    [✓] Previous/Next month buttons work
    [✓] Previous/Next year buttons work
    [✓] "Bulan Ini" / "Tahun Ini" button resets
    [✓] Mode switch (monthly ↔ yearly) works

[✓] URL consistency
    [✓] URL params stay in sync with state
    [✓] Unused params deleted (month when yearly, year when monthly)
    [✓] Page refresh maintains period selection

[✓] Export Excel
    [✓] Excel title includes period label
    [✓] Excel data matches table display
    [✓] Contrats filtered by period in detail sheets
```

---

## 🎯 Key Takeaways

1. **Period Filtering**: Berbasis kontrak yang dibuat (start_date), bukan kontrak yang dibayar
2. **No Fallback**: Jika agent tidak punya kontrak di periode, omset = 0 (tidak fallback ke lifetime)
3. **Monthly Reset**: Setiap tgl 1, data "reset" ke bulan baru
4. **Yearly Accumulation**: Tahun berjalan mengakumulasi semua kontrak sejak 1 Jan
5. **Consistent Everywhere**: Tabel, Export Excel, Customer counts semua menggunakan periode yang sama

Status: ✅ **PRODUCTION-READY** - No issues found
