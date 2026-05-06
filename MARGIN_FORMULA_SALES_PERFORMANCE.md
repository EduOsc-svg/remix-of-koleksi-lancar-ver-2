# 📊 FORMULA MARGIN PERFORMA SALES: MODAL × BERAPA% = OMSET

**Status:** ✅ VERIFIED (Formula sudah benar)  
**Date:** 27 April 2026  
**Version:** 1.0

---

## 🎯 PENJELASAN FORMULA

### Formula Margin:
```
Margin = (Omset - Modal) / Modal × 100%
```

### Interpretasi:
```
Modal × (1 + Margin%) = Omset

Contoh:
├─ Modal: Rp 100.000
├─ Margin: 25%
└─ Omset: Rp 100.000 × (1 + 25%) = Rp 125.000

Artinya: Untuk setiap Rp 100 modal, menghasilkan Rp 125 omset
```

### Breakdown:
```
┌─────────────────────────────────────────┐
│ Modal          │ Rp 100.000 (100%)     │
│ Keuntungan     │ Rp 25.000 (25%)       │
│ Total (Omset)  │ Rp 125.000 (125%)     │
└─────────────────────────────────────────┘

Margin % = (Rp 25.000 / Rp 100.000) × 100 = 25%
```

---

## 📝 IMPLEMENTASI DI KODE

### 1. useMonthlyPerformance.ts (Monthly Performance)

**Location:** Lines 152

**Current Code:**
```typescript
const profit = total_omset - total_modal;
const profitMargin = total_modal > 0 ? (profit / total_modal) * 100 : 0;
```

**Formula Check:**
```
profit = Omset - Modal ✅
profitMargin = (profit / modal) × 100 = ((Omset - Modal) / Modal) × 100 ✅
```

**Status:** ✅ CORRECT

---

### 2. useYearlyFinancialSummary.ts (Yearly Performance)

**Location:** Multiple locations

#### Summary Level (Line 323):
```typescript
const profitMargin = totalModal > 0 ? (totalProfit / totalModal) * 100 : 0;
```

**Status:** ✅ CORRECT

#### Agent Level (Line 335):
```typescript
const profit_margin = agent_modal > 0 ? (agent_profit / agent_modal) * 100 : 0;
```

**Status:** ✅ CORRECT

---

### 3. useAgentPerformance.ts (Lifetime Agent Performance)

**Location:** Line 112

**Current Code:**
```typescript
const profitMargin = total_modal > 0 ? (profit / total_modal) * 100 : 0;
```

**Status:** ✅ CORRECT

---

### 4. Dashboard.tsx (Monthly Dashboard Display)

**Location:** Line 265

**Display Logic:**
```typescript
const grossProfitMargin = monthlyData?.profit_margin || 0;
```

**Card Information:**
```
Label: "Margin Kotor"
Formula: "(Omset − Modal) / Modal"
Example: "25% berarti tiap Rp 100 modal hasilkan Rp 25 keuntungan kotor"
```

**Status:** ✅ CORRECT & DOCUMENTED

---

### 5. SalesAgents.tsx (Sales Agent Performance Table)

**Monthly Tab - Line 352:**
```typescript
const profitMargin = agent.profit_margin.toFixed(1);
```

**Yearly Tab - Line 508:**
```typescript
const profitMargin = agent.profit_margin.toFixed(1);
```

**Display in Table:**
```
Column Header: "Margin %"
Value: profit_margin formatted to 1 decimal place
Example: "25.0%"
```

**Status:** ✅ CORRECT

---

## 🔍 VERIFIKASI RUMUS

### Test Case 1: Kontrak Rp 1.000.000 (Modal) → Rp 1.250.000 (Omset)

```
Modal: Rp 1.000.000
Omset: Rp 1.250.000
Keuntungan: Rp 1.250.000 - Rp 1.000.000 = Rp 250.000

Margin = (Rp 250.000 / Rp 1.000.000) × 100 = 25%
Verifikasi: Rp 1.000.000 × (1 + 25%) = Rp 1.250.000 ✅
```

### Test Case 2: Kontrak Rp 500.000 (Modal) → Rp 650.000 (Omset)

```
Modal: Rp 500.000
Omset: Rp 650.000
Keuntungan: Rp 650.000 - Rp 500.000 = Rp 150.000

Margin = (Rp 150.000 / Rp 500.000) × 100 = 30%
Verifikasi: Rp 500.000 × (1 + 30%) = Rp 650.000 ✅
```

### Test Case 3: Multiple Contracts

```
Sales Agent ABC:
├─ Kontrak 1: Modal Rp 100k → Omset Rp 125k (25% margin)
├─ Kontrak 2: Modal Rp 200k → Omset Rp 250k (25% margin)
├─ Kontrak 3: Modal Rp 300k → Omset Rp 390k (30% margin)

Total:
├─ Total Modal: Rp 600.000
├─ Total Omset: Rp 765.000
├─ Total Keuntungan: Rp 165.000
└─ Margin: (Rp 165.000 / Rp 600.000) × 100 = 27.5%

Verifikasi: Rp 600.000 × (1 + 27.5%) = Rp 765.000 ✅
```

---

## 📊 DISPLAY DALAM APLIKASI

### 1. Dashboard - Summary Card
```
┌─────────────────────────┐
│ Margin Kotor            │
│ 25.5%                   │
│ (Omset − Modal) / Modal │
└─────────────────────────┘
```

### 2. Sales Agents Table (Monthly)
```
┌──────────┬────────┬──────────────┬──────────┬──────────┬─────────┐
│ No       │ Sales  │ Modal        │ Omset    │ Profit   │ Margin% │
├──────────┼────────┼──────────────┼──────────┼──────────┼─────────┤
│ 1        │ AZK-01 │ Rp 1.000.000 │ Rp 1.3M  │ Rp 300k  │ 30.0%   │
│ 2        │ XYZ-02 │ Rp 500.000   │ Rp 625k  │ Rp 125k  │ 25.0%   │
└──────────┴────────┴──────────────┴──────────┴──────────┴─────────┘
```

### 3. Sales Agents Table (Yearly)
```
┌──────────┬────────┬──────────────┬──────────┬──────────┬─────────┐
│ No       │ Sales  │ Total Modal  │ Total O. │ Profit   │ Margin% │
├──────────┼────────┼──────────────┼──────────┼──────────┼─────────┤
│ 1        │ AZK-01 │ Rp 5.000.000 │ Rp 6.5M  │ Rp 1.5M  │ 30.0%   │
│ 2        │ XYZ-02 │ Rp 3.000.000 │ Rp 3.75M │ Rp 750k  │ 25.0%   │
└──────────┴────────┴──────────────┴──────────┴──────────┴─────────┘
```

---

## ✅ CEKLIS IMPLEMENTASI

- [x] **useMonthlyPerformance.ts** - Formula `(profit / modal) × 100` ✅
- [x] **useYearlyFinancialSummary.ts** - Summary level margin ✅
- [x] **useYearlyFinancialSummary.ts** - Agent level margin ✅
- [x] **useAgentPerformance.ts** - Lifetime agent margin ✅
- [x] **Dashboard.tsx** - Display margin dengan dokumentasi ✅
- [x] **SalesAgents.tsx** - Monthly tab display ✅
- [x] **SalesAgents.tsx** - Yearly tab display ✅

---

## 🎯 BUSINESS LOGIC

### Interpretasi Margin untuk Management:

```
Margin 0%   → Modal masuk, tidak ada keuntungan (break even)
Margin 10%  → Untuk Rp 100 modal, dapat Rp 10 keuntungan
Margin 20%  → Untuk Rp 100 modal, dapat Rp 20 keuntungan
Margin 25%  → Untuk Rp 100 modal, dapat Rp 25 keuntungan
Margin 30%  → Untuk Rp 100 modal, dapat Rp 30 keuntungan
Margin 50%  → Untuk Rp 100 modal, dapat Rp 50 keuntungan
```

### Target Management:

```
Typical Target Margin: 20-30%
├─ Artinya untuk setiap Rp 100 modal, target dapat Rp 20-30 keuntungan
├─ Sales agent dengan margin < 20% perlu evaluasi
└─ Sales agent dengan margin > 35% adalah top performer
```

---

## 📋 KONTROL KUALITAS

### ✅ Verified in Code:
- [x] All profit margin calculations use correct formula
- [x] Formula consistent across all hooks
- [x] Dashboard displays correct percentage
- [x] Sales agent table shows correct values
- [x] Both monthly and yearly calculations aligned

### ✅ Test Coverage:
- [x] Zero modal scenario → return 0% (not NaN)
- [x] Single contract scenario → correct calculation
- [x] Multiple contracts scenario → correct aggregation
- [x] Formatting → displays to 1 decimal place

---

## 🚀 DEPLOYMENT STATUS

**Status:** ✅ READY FOR PRODUCTION

All margin calculations are already implemented correctly with the formula:
```
Margin% = (Omset - Modal) / Modal × 100
```

Which equals:
```
Modal × (1 + Margin%) = Omset
```

**No code changes required** - formula is already correct across all files.

---

**Last Updated:** 27 April 2026  
**Verified By:** Code Review  
**Status:** ✅ CONFIRMED CORRECT

