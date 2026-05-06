# MONTHLY OMSET & COMMISSION RESET - DOKUMENTASI FITUR

## Deskripsi
Sistem otomatis untuk reset omset dan komisi sales agent setiap tanggal 1 bulan.

Fitur ini memastikan bahwa:
1. **Monthly Tracking**: Omset dan komisi sales agent direset otomatis setiap tanggal 1 bulan
2. **Akumulasi Per Bulan**: Setiap kontrak yang dibuat dalam sebulan akan menambah `monthly_omset` 
3. **Komisi Dinamis**: `monthly_commission` dihitung otomatis berdasarkan tier komisi untuk `monthly_omset`
4. **Tracking Realtime**: Tidak perlu menunggu akhir bulan untuk melihat pencapaian

## Database Schema (New Columns)

### Tabel: `sales_agents`

**Kolom Baru:**
```sql
- monthly_omset NUMERIC DEFAULT 0
  → Cumulative omset dari kontrak yang dibuat bulan ini (dalam Rupiah)
  → Reset ke 0 setiap tanggal 1 bulan
  
- monthly_commission NUMERIC DEFAULT 0
  → Komisi bulan ini dihitung dari monthly_omset × tier komisi (%)
  → Reset ke 0 setiap tanggal 1 bulan
  
- last_monthly_reset TIMESTAMP WITH TIME ZONE
  → Timestamp kapan terakhir reset bulanan dilakukan
  → Digunakan untuk validasi apakah sudah reset bulan ini
```

## Proses Otomatis

### 1. Trigger: `trigger_update_monthly_omset_on_contract`

**Kapan**: Setiap kontrak BARU dibuat (INSERT pada `credit_contracts`)

**Proses**:
1. Cek apakah agent sudah di-reset bulan ini
   - Jika belum (bulan berbeda atau NULL), reset `monthly_omset` dan `monthly_commission` ke 0
   - Set `last_monthly_reset` ke waktu sekarang
2. Tambah `monthly_omset` dengan nilai `total_loan_amount` kontrak baru
3. Hitung tier komisi berdasarkan `monthly_omset` yang baru (dari tabel `commission_tiers`)
4. Update `monthly_commission` = `monthly_omset` × (tier % / 100)

**Query Executes**:
```
UPDATE sales_agents 
SET monthly_omset = monthly_omset + [new_contract_amount],
    monthly_commission = [new_monthly_omset] × [tier_percentage] / 100
WHERE id = [sales_agent_id]
```

### 2. Function: `reset_monthly_omset_commission()`

**Kapan**: Bisa dipanggil manual atau via cron job pada tanggal 1

**Proses**:
1. Update semua agent: set `monthly_omset` dan `monthly_commission` ke 0
2. Set `last_monthly_reset` ke NOW()
3. Return list agent yang di-reset (untuk verifikasi)

**Usage** (SQL):
```sql
SELECT * FROM reset_monthly_omset_commission();
```

## UI Integration

### Sales Agents Page (`src/pages/SalesAgents.tsx`)

**Perubahan**:
- Ketika `period=monthly` di URL parameter:
  - Omset ditampilkan dari kolom `sales_agents.monthly_omset` (bukan dari perhitungan kontrak)
  - Komisi ditampilkan dari kolom `sales_agents.monthly_commission` (bukan dari tier calculation)
  - Label kolom berubah menjadi "Omset Bulan Ini" dan "Komisi Bulan Ini"

- Ketika `period=yearly` atau default:
  - Tetap menggunakan perhitungan dari hook `useAgentOmset()` (lifetime values)
  - Ini mempertahankan backward compatibility

**Code Logic** (`getAgentOmset` function):
```typescript
const useMonthlyTracking = periodParam === 'monthly' && agentData;
if (useMonthlyTracking) {
  total_omset = agentData.monthly_omset;
  total_commission = agentData.monthly_commission;
} else {
  // Use calculated values from hooks
  total_omset = periodRecord?.total_omset ?? lifetime?.total_omset ?? 0;
  total_commission = periodRecord?.total_commission ?? lifetime?.total_commission ?? 0;
}
```

### Hook: `useSalesAgents()`

**Interface Update**:
```typescript
export interface SalesAgent {
  id: string;
  agent_code: string;
  name: string;
  phone: string | null;
  commission_percentage: number | null;
  use_tiered_commission: boolean;
  monthly_omset: number;         // NEW
  monthly_commission: number;    // NEW
  last_monthly_reset: string | null; // NEW
  created_at: string;
}
```

## Migration Files

### 1. `20260501120000_add_monthly_omset_commission.sql`
- Add 3 kolom baru ke `sales_agents` table
- Create index untuk performa

### 2. `20260501120100_monthly_omset_functions.sql`
- Create function `reset_monthly_omset_commission()`
- Create function `update_monthly_omset_on_contract()`
- Create trigger `trigger_update_monthly_omset_on_contract` on `credit_contracts` INSERT

## Contoh Skenario

### Scenario: Ahmad membuat 3 kontrak di Mei

**Mei 1 (Pagi)**:
- Ahmad: monthly_omset = 0, monthly_commission = 0, last_monthly_reset = 2026-05-01 08:00

**Mei 2 - Contract 1 dibuat** (omset Rp 50jt):
- Trigger fires → Add 50jt ke monthly_omset
- Ahmad: monthly_omset = 50,000,000
- Tier komisi untuk 50jt = 6% (dari commission_tiers)
- Ahmad: monthly_commission = 50,000,000 × 0.06 = 3,000,000 (Rp 3jt)

**Mei 5 - Contract 2 dibuat** (omset Rp 40jt):
- Trigger fires → Add 40jt ke monthly_omset
- Ahmad: monthly_omset = 90,000,000
- Tier komisi untuk 90jt = 7.75% (lebih tinggi tier!)
- Ahmad: monthly_commission = 90,000,000 × 0.0775 = 6,975,000 (Rp 6.975jt)

**Mei 10 - Contract 3 dibuat** (omset Rp 20jt):
- Ahmad: monthly_omset = 110,000,000
- Tier komisi untuk 110jt = 8.25% (tier paling tinggi!)
- Ahmad: monthly_commission = 110,000,000 × 0.0825 = 9,075,000 (Rp 9.075jt)

**Juni 1 (Otomatis)**:
- Trigger reset fires atau manual call `reset_monthly_omset_commission()`
- Ahmad: monthly_omset = 0, monthly_commission = 0
- Ahmad: last_monthly_reset = 2026-06-01 00:00
- Cycle dimulai lagi untuk Juni

## Testing Checklist

- [ ] Build berhasil tanpa error
- [ ] Migrations dapat di-apply di Supabase
- [ ] Ketika period=monthly, tampilan tabel menunjukkan monthly_omset
- [ ] Ketika kontrak baru dibuat, monthly_omset dan monthly_commission terupdate
- [ ] Tier komisi berubah seiring naik omset (bukan fixed per agent)
- [ ] Manual test reset: panggil function `reset_monthly_omset_commission()`, pastikan values reset
- [ ] Export Excel: monthly report menampilkan data yang benar
- [ ] Pagination dan sorting berfungsi dengan data baru

## Future Enhancements

1. **Cron Job**: Setup automatic reset di Supabase setiap tanggal 1 via edge function
2. **Reset UI Button**: Admin button di SalesAgents page untuk manual reset jika diperlukan
3. **Monthly History**: Audit trail - track monthly_omset & commission changes per bulan
4. **Telegram/Email Notification**: Alert ketika agent mencapai tier komisi baru
5. **Bonus Tracking**: Track monthly bonus (0.8% tahunan) terpisah dari tier komisi

## Notes

- ✅ Backward compatible: yearly view tetap bekerja seperti sebelumnya
- ✅ Transaction safe: trigger handle reset check atomically
- ⚠️ Timezone: Pastikan Supabase timezone setting sesuai (gunakan UTC atau Waktu Indonesia)
- ⚠️ Manual Reset: Jika ada perubahan data (kontrak di-delete), monthly values tidak auto-adjust. Perlu logic tambahan jika diperlukan.
