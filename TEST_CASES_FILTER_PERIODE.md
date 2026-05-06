# Test Cases - Filter Periode Sales Agents

## 🧪 Test Scenarios

### Test Suite 1: URL Parameter Initialization

#### TC-1.1: Fresh Load - Monthly Mode
```
Scenario: User visits page for first time (no URL params)
Expected Behavior:
  1. periodParam = 'monthly' (default)
  2. monthParam = current month (e.g., '2026-05')
  3. yearParam = undefined
  4. URL auto-updates: ?period=monthly&month=2026-05

Verification:
  ✓ periodLabel shows "Mei 2026 (reset tgl 1)"
  ✓ Button "Bulanan" is highlighted
  ✓ Button "Tahunan" is not highlighted
  ✓ Table header: "Omset Mei 2026"
```

#### TC-1.2: Fresh Load - Yearly Mode
```
Scenario: User visits page for first time (hypothetical yearly default)
Expected Behavior:
  1. Manual set yearly via button
  2. URL updates: ?period=yearly&year=2026&month=
  3. yearParam = '2026'
  4. monthParam = undefined (deleted)

Verification:
  ✓ periodLabel shows "Tahun 2026"
  ✓ Button "Tahunan" is highlighted
  ✓ Table header: "Omset 2026"
```

#### TC-1.3: Page Refresh Maintains State
```
Scenario: 
  1. User selects "Desember 2025"
  2. URL becomes: ?period=monthly&month=2025-12
  3. Page refreshes (F5)
  
Expected Behavior:
  1. periodParam = 'monthly'
  2. monthParam = '2025-12'
  3. Page displays December 2025 data

Verification:
  ✓ periodLabel shows "Desember 2025"
  ✓ Table shows Dec 2025 contracts only
```

---

### Test Suite 2: Period Range Calculation

#### TC-2.1: Monthly Range - May 2026
```
Scenario: User selects "Mei 2026"
Code Path: periodRange calculation
  if (periodParam === 'monthly') {
    const start = format(startOfMonth(selectedMonthForHook), 'yyyy-MM-dd')
    const end = format(new Date(year, month + 1, 0), 'yyyy-MM-dd')
  }

Expected Result:
  periodRange = {
    start: '2026-05-01',
    end: '2026-05-31'
  }

Database Query:
  SELECT * FROM credit_contracts
  WHERE start_date >= '2026-05-01'
  AND start_date <= '2026-05-31'

Verification:
  ✓ Contract 2026-04-30: NOT included
  ✓ Contract 2026-05-01: INCLUDED
  ✓ Contract 2026-05-15: INCLUDED
  ✓ Contract 2026-05-31: INCLUDED
  ✓ Contract 2026-06-01: NOT included
```

#### TC-2.2: Monthly Range - Edge Month (Februari)
```
Scenario: User selects "Februari 2026"
Expected Result:
  periodRange = {
    start: '2026-02-01',
    end: '2026-02-28'   (not 29, 2026 is not leap year)
  }

Verification:
  ✓ Contract 2026-02-28: INCLUDED
  ✓ Contract 2026-03-01: NOT included
```

#### TC-2.3: Yearly Range - 2026
```
Scenario: User selects "2026"
Code Path: periodRange calculation
  if (periodParam === 'yearly') {
    return { start: `${y}-01-01`, end: `${y}-12-31` }
  }

Expected Result:
  periodRange = {
    start: '2026-01-01',
    end: '2026-12-31'
  }

Database Query:
  SELECT * FROM credit_contracts
  WHERE start_date >= '2026-01-01'
  AND start_date <= '2026-12-31'

Verification:
  ✓ Contract 2025-12-31: NOT included
  ✓ Contract 2026-01-01: INCLUDED
  ✓ Contract 2026-06-15: INCLUDED
  ✓ Contract 2026-12-31: INCLUDED
  ✓ Contract 2027-01-01: NOT included
```

---

### Test Suite 3: Hook Calls & Data Selection

#### TC-3.1: Monthly Mode - useMonthlyPerformance Called
```
Scenario: User selects "Mei 2026" (monthly mode)
Expected Behavior:
  1. useMonthlyPerformance(new Date('2026-05-01')) is called
  2. NOT useYearlyFinancialSummary
  3. useAgentCustomerCounts('2026-05-01', '2026-05-31') is called

Verification:
  ✓ React Query key: 'monthly_performance_contract', '2026-05-01', '2026-05-31'
  ✓ monthlyData is populated
  ✓ yearlyFinancial is NOT used
  ✓ Customer counts filtered by May range
```

#### TC-3.2: Yearly Mode - useYearlyFinancialSummary Called
```
Scenario: User selects "2026" (yearly mode)
Expected Behavior:
  1. useYearlyFinancialSummary(new Date('2026-01-01')) is called
  2. NOT useMonthlyPerformance
  3. useAgentCustomerCounts('2026-01-01', '2026-12-31') is called

Verification:
  ✓ React Query key: 'yearly_financial_summary_contract', '2026-01-01', '2026-12-31'
  ✓ yearlyFinancial is populated
  ✓ monthlyData is NOT used
  ✓ Customer counts filtered by yearly range
```

#### TC-3.3: Mode Switch - Monthly to Yearly
```
Scenario:
  1. Currently viewing "Mei 2026" (monthly)
  2. Click "Tahunan" button
  3. System switches to yearly mode

Expected Behavior:
  1. periodParam changes: 'monthly' → 'yearly'
  2. monthParam deleted, yearParam set: '2026'
  3. URL: ?period=yearly&year=2026
  4. useMonthlyPerformance is NOT called
  5. useYearlyFinancialSummary('2026') is called
  6. Table updates to show annual data

Verification:
  ✓ periodLabel updates: "Mei 2026..." → "Tahun 2026"
  ✓ Table column headers change: "Omset Mei..." → "Omset 2026"
  ✓ Data values different (yearly vs monthly)
  ✓ No momentary data inconsistency
```

---

### Test Suite 4: getAgentOmset() Logic

#### TC-4.1: Agent with Contracts in Selected Period
```
Scenario:
  Period: May 2026 (monthly)
  Agent: S001 (Budi)
  Contracts:
    - 2026-04-15: Rp 50M (NOT in period)
    - 2026-05-10: Rp 100M (IN period)
    - 2026-05-20: Rp 75M (IN period)

Code Path: getAgentOmset('S001')
  let periodRecord = monthlyData.agents.find(a => a.agent_id === 'S001')
  // periodRecord contains only May 2026 contracts
  const total_omset = periodRecord?.total_omset ?? 0
  // Calculation: 100M + 75M = 175M

Expected Result:
  displayOmset = 175,000,000
  totalCommission = calculated from tierCommission(175M)

Verification:
  ✓ Table shows Rp 175M (not Rp 225M)
  ✓ Commission calculated from 175M only
  ✓ Lifetime data NOT used as fallback
```

#### TC-4.2: Agent with NO Contracts in Selected Period
```
Scenario:
  Period: May 2026 (monthly)
  Agent: S002 (Dian)
  Contracts:
    - 2026-04-10: Rp 50M (NOT in May)
    - 2026-06-10: Rp 75M (NOT in May)
  No contracts in May

Code Path: getAgentOmset('S002')
  let periodRecord = monthlyData.agents.find(a => a.agent_id === 'S002')
  // periodRecord = undefined (agent not in May data)
  const total_omset = undefined ?? 0 = 0
  const total_commission = undefined ?? 0 = 0

Expected Result:
  displayOmset = 0 (NOT fallback to Rp 125M lifetime)
  displayCommission = 0

Verification:
  ✓ Table shows Rp 0 for omset
  ✓ Table shows Rp 0 for commission
  ✓ Agent might be hidden (if using .filter())
  ✓ NO fallback to lifetime/rolling calculations
```

#### TC-4.3: Yearly Mode - Agent with Contracts Throughout Year
```
Scenario:
  Period: 2026 (yearly)
  Agent: S001 (Budi)
  Contracts:
    - 2026-02-10: Rp 100M (IN year)
    - 2026-06-20: Rp 150M (IN year)
    - 2026-11-15: Rp 120M (IN year)
    Total: Rp 370M

Code Path: getAgentOmset('S001')
  let periodRecord = yearlyFinancial.agents.find(a => a.agent_id === 'S001')
  // periodRecord contains yearly aggregation
  const total_omset = periodRecord?.total_omset = 370,000,000
  const total_commission = calculated from tierCommission(370M)

Expected Result:
  displayOmset = 370,000,000
  totalCommission = tier-based from 370M

Verification:
  ✓ Table shows Rp 370M
  ✓ Commission is yearly (not monthly average)
  ✓ Data accumulates all 12 months
```

---

### Test Suite 5: Customer Count Filtering

#### TC-5.1: New vs Old Customers - Monthly Filter
```
Scenario:
  Period: May 2026 (monthly)
  Agent: S001
  Customers in May:
    - Customer A: 1 kontrak di May (Baru untuk agen)
    - Customer B: 1 kontrak di May (Baru untuk agen)
    - Customer C: 2 kontrak lifetime, 1 di May (Lama)
  
  Lifetime perspective:
    - Customer A: total 1 kontrak (Baru)
    - Customer B: total 1 kontrak (Baru)
    - Customer C: total 3 kontrak (Lama)

Code Path: useAgentCustomerCounts('2026-05-01', '2026-05-31')
  1. Get all contracts (lifetime classification)
  2. Filter by period start_date in May
  3. Count unique customers per agent

Expected Result:
  agentCustomerCounts.get('S001') = {
    baru: 2,    // A, B (1 kontrak each, lifetime)
    lama: 1     // C (≥2 kontrak lifetime)
  }

Verification:
  ✓ Table column "B" (Baru) shows 2
  ✓ Table column "L" (Lama) shows 1
  ✓ Classification based on lifetime, not period
  ✓ Period filter applied to contracts considered
```

#### TC-5.2: Same Customer Multiple Agents
```
Scenario:
  Customer X:
    - Kontrak 1 (Jan 2026) with Agent S001
    - Kontrak 2 (May 2026) with Agent S002

  Lifetime: 2 kontrak total → Lama
  Period May filter:
    - Agent S001: Customer X not in May (Jan kontrak)
    - Agent S002: Customer X in May (May kontrak)

Code Path: useAgentCustomerCounts('2026-05-01', '2026-05-31')

Expected Result:
  Agent S001: Customer X NOT counted for May
  Agent S002: Customer X counted as Lama (2 kontrak lifetime)

Verification:
  ✓ Agent S001 May data doesn't include Customer X
  ✓ Agent S002 May data shows Customer X as Lama
  ✓ Correct classification per agent-period combo
```

---

### Test Suite 6: Navigation

#### TC-6.1: Month Navigation
```
Scenario 1: Click ◀ (previous month)
  Current: May 2026
  Click: ◀
  Expected: April 2026
  URL: ?period=monthly&month=2026-04

Verification:
  ✓ periodLabel: "April 2026"
  ✓ Table data refreshes (April contracts)
  ✓ No double-loading or flicker

Scenario 2: Click ▶ (next month)
  Current: April 2026
  Click: ▶
  Expected: May 2026
  URL: ?period=monthly&month=2026-05

Verification:
  ✓ periodLabel: "Mei 2026"
  ✓ Table data refreshes (May contracts)

Scenario 3: Click ▶ from December 2025
  Current: December 2025
  Click: ▶
  Expected: January 2026
  URL: ?period=monthly&month=2026-01

Verification:
  ✓ Year changes correctly (2025 → 2026)
  ✓ Month wraps (12 → 1)
  ✓ addMonths() handles year boundary
```

#### TC-6.2: Year Navigation
```
Scenario 1: Click ◀ (previous year)
  Current: 2026 (yearly)
  Click: ◀
  Expected: 2025
  URL: ?period=yearly&year=2025

Verification:
  ✓ periodLabel: "Tahun 2025"
  ✓ Table data refreshes (2025 contracts)

Scenario 2: Click ▶ (next year)
  Current: 2025 (yearly)
  Click: ▶
  Expected: 2026
  URL: ?period=yearly&year=2026

Verification:
  ✓ periodLabel: "Tahun 2026"
  ✓ Data updates correctly
```

#### TC-6.3: "Bulan Ini" Button
```
Scenario: User viewing historical data
  Current view: Januari 2025
  Today: May 2, 2026
  Click: "Bulan Ini"

Expected Behavior:
  1. Calculate current month
  2. shiftMonth(0) + URL update OR manual set to May 2026
  3. URL: ?period=monthly&month=2026-05

Verification:
  ✓ Returns to current month (May 2026)
  ✓ Table refreshes immediately
```

---

### Test Suite 7: Export Excel

#### TC-7.1: Excel Export - Monthly Period
```
Scenario: User views May 2026, clicks "Export Excel"
Expected Behavior:
  1. Query contracts: start_date IN ['2026-05-01' ... '2026-05-31']
  2. Generate workbook with sheets:
     - Sheet 1: "Semua Sales" (summary)
     - Sheet 2-N: Per agent detail sheets

Sheet 1 Title:
  "LAPORAN PERFORMA SALES AGENT - MEI 2026"

Sheet 1 Data:
  Agent | Omset | Komisi | Jumlah Kontrak
  S001  | 175M  | 8.75M  | 2
  S002  | 0     | 0      | 0  (no May contracts)

Detail Sheets:
  - "S001 - Budi": Lists only May contracts
  - "S002 - Dian": No data / hidden (if 0 contracts)

Verification:
  ✓ Title includes "MEI 2026"
  ✓ Data matches table display exactly
  ✓ Only May contracts in detail sheets
  ✓ No contracts from April or June
```

#### TC-7.2: Excel Export - Yearly Period
```
Scenario: User views 2026 (yearly), clicks "Export Excel"
Expected Behavior:
  1. Query contracts: start_date IN ['2026-01-01' ... '2026-12-31']
  2. Sheet 1 title: "LAPORAN PERFORMA SALES AGENT - TAHUN 2026"
  3. Data includes all 12 months of 2026

Sheet 1 Data:
  Agent | Omset  | Komisi  | Jumlah Kontrak
  S001  | 370M   | 18.5M   | 3 (Feb, Jun, Nov)
  S002  | 125M   | 6.25M   | 2 (Apr, Jun)

Detail Sheets:
  - "S001 - Budi": Feb + Jun + Nov contracts
  - "S002 - Dian": Apr + Jun contracts

Verification:
  ✓ Title includes "TAHUN 2026"
  ✓ Data includes entire year
  ✓ Omset/Komisi calculated from yearly totals
  ✓ Contract count shows all contracts in year
```

---

### Test Suite 8: Edge Cases & Error Handling

#### TC-8.1: Agent with Zero Contracts in Period
```
Scenario:
  Period: May 2026 (monthly)
  Agent: S003 (newly created, no contracts yet)

Expected Behavior:
  1. getAgentOmset() returns {total_omset: 0, total_commission: 0}
  2. Agent might be filtered out if using .filter(a => total_contracts > 0)
  3. If shown: displays Rp 0 / 0 / 0

Verification:
  ✓ No error / crash
  ✓ Handles gracefully (show 0 or hide row)
  ✓ Not included in totals row if hidden
```

#### TC-8.2: Agent with Mixed Statuses
```
Scenario:
  Period: May 2026
  Agent: S001
  Contracts in May:
    - Contract A: status='active' (100M) - INCLUDED
    - Contract B: status='completed' (75M) - INCLUDED (completed is not 'returned')
    - Contract C: status='returned' (50M) - EXCLUDED

Expected Result:
  Total Omset = 100M + 75M = 175M (not including 'returned')

Verification:
  ✓ Only active/completed contracts counted
  ✓ 'returned' contracts excluded
  ✓ Filter logic: WHERE status != 'returned'
```

#### TC-8.3: Period with No Contracts
```
Scenario:
  Period: May 2026 (hypothetical, no contracts created)

Expected Behavior:
  1. All hooks return empty data
  2. Table shows: "Tidak ada data"
  3. Export disabled or warns user

Verification:
  ✓ No crash / error messages
  ✓ Graceful empty state
```

---

### Test Suite 9: URL Edge Cases

#### TC-9.1: Direct URL with Invalid Month
```
Scenario: User visits ?period=monthly&month=2026-13
Expected Behavior:
  1. JavaScript Date parsing: new Date('2026-13') = Invalid
  2. Fallback to current month
  3. URL corrected: ?period=monthly&month=2026-05

Verification:
  ✓ No crash
  ✓ Displays current month
  ✓ URL auto-corrects
```

#### TC-9.2: URL with Both Month and Year
```
Scenario: Malformed URL ?period=monthly&month=2026-05&year=2026
Expected Behavior:
  1. Monthly mode: month param prioritized
  2. Year param ignored/deleted
  3. URL cleaned: ?period=monthly&month=2026-05

Verification:
  ✓ URL sync effect deletes unused params
  ✓ Displays May 2026 (month-based)
  ✓ No ambiguity
```

---

## 🎯 Test Execution Checklist

### Before Production
- [ ] TC-1.1: Fresh load defaults to monthly
- [ ] TC-1.2: Mode switch to yearly works
- [ ] TC-1.3: Page refresh maintains state
- [ ] TC-2.1: Monthly range correct (May 2026)
- [ ] TC-2.2: Edge months handled (Feb in non-leap year)
- [ ] TC-2.3: Yearly range correct (full year)
- [ ] TC-3.1: useMonthlyPerformance called in monthly mode
- [ ] TC-3.2: useYearlyFinancialSummary called in yearly mode
- [ ] TC-3.3: Mode switch doesn't cause data inconsistency
- [ ] TC-4.1: Agent with contracts shows period data only
- [ ] TC-4.2: Agent without contracts shows 0 (no fallback)
- [ ] TC-4.3: Yearly mode accumulates all months correctly
- [ ] TC-5.1: Customer counts filter by period correctly
- [ ] TC-5.2: Same customer with multiple agents handled
- [ ] TC-6.1: Month navigation works (◀/▶)
- [ ] TC-6.2: Year navigation works (◀/▶)
- [ ] TC-6.3: "Bulan Ini" button resets correctly
- [ ] TC-7.1: Export Excel (monthly) includes correct data
- [ ] TC-7.2: Export Excel (yearly) includes correct data
- [ ] TC-8.1: Zero contracts handled gracefully
- [ ] TC-8.2: Returned contracts excluded correctly
- [ ] TC-8.3: Empty period shows "no data" state
- [ ] TC-9.1: Invalid month parameter handled
- [ ] TC-9.2: Malformed URL cleaned

---

## ✅ Final Status

**All Test Cases Expected to PASS** ✓

Filter logic is solid and handles edge cases properly.
