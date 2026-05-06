# Perbedaan Data Source: Daily Profit List vs Kalender Penagihan

## 📊 RINGKAS CEPAT

```
┌─────────────────────────────┬──────────────────────────┬──────────────────────┐
│ Component                   │ Data Source              │ Kondisi              │
├─────────────────────────────┼──────────────────────────┼──────────────────────┤
│ Daily Profit List           │ payment_logs table       │ Pembayaran SUDAH ADA │
│ ("Keuntungan Harian")       │ amount_paid field        │ (Cash Basis)         │
│                             │                          │                      │
│ Daily Due List              │ installment_coupons      │ Kupon SEHARUSNYA     │
│ ("Kalender Penagihan")      │ table                    │ dibayar (Accrual)    │
│                             │ due_date field           │                      │
└─────────────────────────────┴──────────────────────────┴──────────────────────┘
```

---

## 🔍 PERBEDAAN DETAIL

### Daily Profit List (Keuntungan Harian)

**Query:**
```sql
SELECT amount_paid, payment_date 
FROM payment_logs 
WHERE payment_date = '2026-04-28'
```

**Logika:**
- Ambil semua pembayaran yang sudah **tercatat di sistem** pada tanggal tertentu
- Field: `amount_paid` (nominal uang yang masuk)
- **Hanya menghitung PEMBAYARAN NYATA yang diterima**

**Contoh:**
- Tgl 28 Apr: 5 pembayaran tercatat = Rp 2.500.000
- Tapi ada 10 kupon yang harusnya jatuh tempo pada tgl ini

---

### Daily Due List (Kalender Penagihan)

**Query:**
```sql
SELECT * FROM installment_coupons 
WHERE due_date = '2026-04-28' 
AND status = 'unpaid'
```

**Logika:**
- Ambil semua kupon yang memiliki **due_date = hari ini** dan belum dibayar
- Ini adalah **target penagihan** (berapa kupon yg SEHARUSNYA dibayar)
- **BUKAN jumlah yang sudah diterima**

**Contoh:**
- Tgl 28 Apr: 10 kupon yang jatuh tempo
- Nominal seharusnya: 10 × Rp 500.000 = Rp 5.000.000
- **Tapi yang tertagih hanya: Rp 2.500.000 (dari 5 kupon)**

---

## 💡 ANALOGI

Think of it like:
- **Kalender Penagihan** = Resep (berapa banyak yg SEHARUSNYA masak)
- **Daily Profit List** = Hidangan yang sudah jadi (berapa banyak yang SUDAH tersaji)

Kalau hari ini harusnya masak 10 porsi, tapi hanya 5 porsi yang jadi → yang ditampilkan di Profit adalah 5 porsi itu saja.

---

## ✅ KENAPA INI PENTING?

1. **Monitoring Target Penagihan** → Gunakan Daily Due List (Kalender Penagihan)
   - "Hari ini harusnya tarik berapa? Ada 10 kupon jatuh tempo"

2. **Tracking Revenue Nyata** → Gunakan Daily Profit List (Keuntungan Harian)
   - "Hari ini berapa yg masuk? Rp 2.500.000 dari 5 pembayaran"

3. **Akurasi Laporan Keuangan** → Daily Profit List lebih akurat
   - Basis: Uang yang sudah masuk (cash basis)
   - Bukan janji pembayaran yang belum terwujud

---

## 🎯 KESIMPULAN

**"Total Tertagih" di Daily Profit List lebih KECIL dari Kalender Penagihan karena:**
- Daily Profit = PEMBAYARAN REAL yang diterima ✓ 💰
- Kalender Penagihan = TARGET penagihan yang SEHARUSNYA diterima 📋

Perbedaan ini adalah **koleksi yang BELUM tercatat** atau **tersendat**.
