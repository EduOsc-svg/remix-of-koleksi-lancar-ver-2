# 📊 PENJELASAN: Mengapa Sisa Tagihan Sekarang Naik Saat Kontrak Bertambah

## ✅ Masalah Sudah Diperbaiki!

### Yang Terjadi Sebelumnya:
```
Buat Kontrak Baru 15 April
├─ Omset April: +Rp 1.000.000 ✅
└─ Sisa Tagihan: +Rp 0 ❌ TETAP! (BUG)

Mengapa? Karena sistem hanya hitung kupon yang jatuh tempo APRIL
Tapi kontrak baru punya kupon jatuh tempo MEI-JULI!
```

---

## 🔧 Perbaikan yang Dilakukan

### Kalkulasi Lama (SALAH):
```
Sisa Tagihan = Jumlah kupon UNPAID yang jatuh tempo bulan ini
```
❌ Ini tidak termasuk kupon yang jatuh tempo bulan depan/berikutnya!

### Kalkulasi Baru (BENAR):
```
Sisa Tagihan = Jumlah kupon UNPAID dari SEMUA kontrak dibuat bulan ini
```
✅ Ini menghitung SEMUA kupon unpaid, tanpa filter tanggal jatuh tempo

---

## 📈 Sekarang:

```
Buat Kontrak Baru 15 April
├─ Omset April: +Rp 1.000.000 ✅
└─ Sisa Tagihan: +Rp 1.000.000 ✅ NAIK! (FIXED!)

Status: Sisa Tagihan sekarang akurat & match dengan Omset! 🎉
```

---

## 💡 Logika Baru

| Item | Perhitungan |
|------|-----------|
| **Modal** | Total modal dari kontrak dibuat bulan ini |
| **Omset** | Total omset dari kontrak dibuat bulan ini |
| **Sisa Tagihan** | Total kupon unpaid dari kontrak dibuat bulan ini |
| **Tertagih** | Total pembayaran yang masuk bulan ini |

✅ **Sekarang konsisten!** Semua berbasis kontrak yang dibuat bulan ini (bukan berbasis tanggal jatuh tempo)

---

## 🎯 Contoh Praktis

### Kontrak Baru April 15 (Tenor 100 hari):
- Total: Rp 1.000.000
- Daily Installment: Rp 10.000
- Jumlah Kupon: 100

#### Kupon Schedule:
```
Kupon 1-16:    15-30 April (jatuh tempo April)
Kupon 17-47:   01-31 Mei   (jatuh tempo Mei)
Kupon 48-77:   01-30 Juni  (jatuh tempo Juni)
Kupon 78-100:  01-23 Juli  (jatuh tempo Juli)
```

#### Dashboard April:
**SEBELUMNYA (SALAH):**
- Omset April: Rp 1.000.000 ✅
- Sisa Tagihan: Rp 160.000 ❌ (hanya kupon 1-16 yang jatuh tempo April)

**SEKARANG (BENAR):**
- Omset April: Rp 1.000.000 ✅
- Sisa Tagihan: Rp 1.000.000 ✅ (semua 100 kupon!)

---

## 🎨 User Experience

### Sebelumnya:
```
Buat kontrak → Omset naik ✅ tapi Sisa Tagihan tetap ❌
User: "Kok tetap? Bug kah?" 😕
```

### Sekarang:
```
Buat kontrak → Omset naik ✅ DAN Sisa Tagihan naik ✅
User: "Oke, masuk akal!" 😊
```

---

## ✅ Testing

✅ TypeScript compilation: PASS
✅ Logic verification: PASS
✅ Data accuracy: PASS

---

**Pertanyaan user sangat bagus!** Ini membantu kami catch bug. Terima kasih! 🙏
