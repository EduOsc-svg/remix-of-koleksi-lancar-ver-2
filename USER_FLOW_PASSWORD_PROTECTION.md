# 🔐 User Flow: Password-Protected Contract Operations

## 📋 Daftar Operasi yang Dilindungi

Operasi-operasi berikut ini kini memerlukan password admin untuk dieksekusi:

1. **CREATE** - Membuat kontrak baru
2. **UPDATE** - Mengubah data kontrak
3. **DELETE** - Menghapus kontrak
4. **RETURN** - Menandai kontrak sebagai macet/return

---

## 🔄 User Flow Diagrams

### Flow 1: UPDATE KONTRAK

```
┌─────────────────────────────────────────────────────────────┐
│ USER ACTION: Edit Kontrak dan Klik "Simpan"                │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────┐
        │ FORM VALIDATION          │
        │ ─────────────────        │
        │ ✓ Pelanggan dipilih      │
        │ ✓ Tanggal diisi          │
        │ ✓ Total pinjaman valid   │
        │ ✓ Tenor valid            │
        │ ✓ Modal awal valid       │
        └──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │ Validasi OK?         │
        └──────────┬──────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
        NO                  YES
         │                   │
         ↓                   ↓
    ❌ Error Toast      🔐 PASSWORD DIALOG
                        ┌───────────────────────────┐
                        │ Konfirmasi Password      │
                        │                          │
                        │ Masukkan password admin: │
                        │ [_____________________]  │
                        │                          │
                        │ [Batal]  [Verifikasi]    │
                        └────────┬────────────────┘
                                 │
                        User masukkan password
                                 │
                        ┌────────┴─────────┐
                        │                  │
                   Klik "Batal"      Klik "Verifikasi"
                        │                  │
                   ✗ Dialog tutup      Backend verify
                   ✗ Tidak ada          password
                     perubahan              │
                                   ┌───────┴──────┐
                                   │              │
                              PASSWORD        PASSWORD
                              SALAH           BENAR
                                   │              │
                                   ↓              ↓
                             ❌ Error toast   ✅ Eksekusi
                             "Password       UPDATE
                              salah"
                                   │              │
                              Input reset    - Update data
                              Dialog tetap   - Show toast
                              terbuka          "Berhasil"
                                            - Close dialog
                                            - Refresh table
```

### Flow 2: DELETE KONTRAK

```
┌──────────────────────────────────────────────────────────────┐
│ USER ACTION: Klik Tombol Delete Kontrak                     │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ↓
    ┌─────────────────────────────────────┐
    │ DELETE CONFIRMATION DIALOG          │
    │                                     │
    │ Hapus Kontrak?                      │
    │                                     │
    │ Tindakan ini tidak dapat dibatalkan │
    │ Semua kupon juga akan dihapus       │
    │                                     │
    │ [Batal]  [Hapus]                    │
    └────────┬───────────┬────────────────┘
             │           │
        "Batal"      "Hapus"
             │           │
             ↓           ↓
        Dialog tutup  🔐 PASSWORD DIALOG
                      ┌───────────────────────────┐
                      │ Konfirmasi Password      │
                      │                          │
                      │ Masukkan password admin: │
                      │ [_____________________]  │
                      │                          │
                      │ [Batal]  [Verifikasi]    │
                      └────────┬────────────────┘
                               │
                      User masukkan password
                               │
                      ┌────────┴─────────┐
                      │                  │
                 "Batal"           "Verifikasi"
                      │                  │
                 Dialog tutup      Backend verify
                 Tidak ada delete       │
                                ┌──────┴──────┐
                                │             │
                           PASSWORD       PASSWORD
                           SALAH          BENAR
                                │             │
                                ↓             ↓
                          ❌ Error toast  ✅ Eksekusi
                          "Password       DELETE
                           salah"
                                │             │
                           Input reset   - Delete kontrak
                           Dialog tetap  - Delete coupons
                           terbuka       - Show toast
                                         - Close dialogs
                                         - Refresh table
```

### Flow 3: RETURN KONTRAK (Mark as Macet)

```
┌──────────────────────────────────────────────────────────────┐
│ USER ACTION: Klik Tombol Return Kontrak                     │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ↓
    ┌────────────────────────────────────────────┐
    │ RETURN CONFIRMATION DIALOG                 │
    │                                            │
    │ Return Kontrak?                            │
    │                                            │
    │ Kontrak [A001] akan ditandai Macet.        │
    │                                            │
    │ Dampak:                                    │
    │ - Data tetap tersimpan                     │
    │ - Sisa tagihan dibatalkan                  │
    │ - Omset & komisi tidak dihitung            │
    │                                            │
    │ [Batal]  [Ya, Return Kontrak]              │
    └────────┬──────────┬────────────────────────┘
             │          │
        "Batal"     "Ya, Return"
             │          │
             ↓          ↓
        Dialog tutup  🔐 PASSWORD DIALOG
                      ┌───────────────────────────┐
                      │ Konfirmasi Password      │
                      │                          │
                      │ Masukkan password admin: │
                      │ [_____________________]  │
                      │                          │
                      │ [Batal]  [Verifikasi]    │
                      └────────┬────────────────┘
                               │
                      User masukkan password
                               │
                      ┌────────┴─────────┐
                      │                  │
                 "Batal"           "Verifikasi"
                      │                  │
                 Dialog tutup      Backend verify
                 Tidak ada return       │
                                ┌──────┴──────┐
                                │             │
                           PASSWORD       PASSWORD
                           SALAH          BENAR
                                │             │
                                ↓             ↓
                          ❌ Error toast  ✅ Eksekusi
                          "Password       RETURN
                           salah"
                                │             │
                           Input reset   - Update status
                           Dialog tetap  - Cancel unpaid
                           terbuka         coupons
                                         - Refresh queries
                                         - Show toast
                                         - Close dialogs
```

### Flow 4: CREATE KONTRAK

```
┌──────────────────────────────────────────────────────────────┐
│ USER ACTION: Buat Kontrak Baru dan Klik "Buat"             │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────┐
        │ FORM VALIDATION          │
        │ ─────────────────        │
        │ ✓ Pelanggan dipilih      │
        │ ✓ Sales agent dipilih    │
        │ ✓ Kolektor dipilih       │
        │ ✓ Tanggal diisi          │
        │ ✓ Total pinjaman valid   │
        │ ✓ Tenor valid            │
        │ ✓ Modal awal valid       │
        └──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │ Validasi OK?         │
        └──────────┬──────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
        NO                  YES
         │                   │
         ↓                   ↓
    ❌ Error Toast      🔐 PASSWORD DIALOG
                        ┌───────────────────────────┐
                        │ Konfirmasi Password      │
                        │                          │
                        │ Masukkan password admin: │
                        │ [_____________________]  │
                        │                          │
                        │ [Batal]  [Verifikasi]    │
                        └────────┬────────────────┘
                                 │
                        User masukkan password
                                 │
                        ┌────────┴─────────┐
                        │                  │
                   Klik "Batal"      Klik "Verifikasi"
                        │                  │
                   ✗ Dialog tutup      Backend verify
                   ✗ Form masih        password
                     terbuka               │
                                   ┌───────┴──────┐
                                   │              │
                              PASSWORD        PASSWORD
                              SALAH           BENAR
                                   │              │
                                   ↓              ↓
                             ❌ Error toast   ✅ Eksekusi
                             "Password       CREATE
                              salah"
                                   │              │
                              Input reset    - Create kontrak
                              Dialog tetap   - Generate coupons
                              terbuka        - Show toast
                                            - Close dialog
                                            - Refresh table
```

---

## 🎯 Key Points untuk Users

### ✅ DO:
- **Enter password carefully** - Typo = password salah = try again
- **Use strong password** - Min 12 characters recommended
- **Keep password secure** - Don't share dengan orang lain
- **Cancel if unsure** - Klik "Batal" jika ingin abort operasi
- **Wait for confirmation** - Tunggu toast success sebelum tutup aplikasi

### ❌ DON'T:
- **Share password di chat** - Admin password harus dirahasiakan
- **Write password down** - Gunakan password manager
- **Click multiple times** - Tunggu response dari backend
- **Close browser during operation** - Biarkan operasi selesai
- **Ignore error messages** - Baca error message dengan teliti

---

## 🔐 Password Verification Process

### Behind the Scenes:

```
Frontend (Contracts.tsx)          Backend (Edge Function)
─────────────────────────────────────────────────────
   User masukkan password
          │
          ├─ Validate not empty
          │
          ├─ Call verifyPassword()
          │
          └─ Send POST to Edge Function
                    │
                    ├─ Receive { password }
                    │
                    ├─ Compare dengan env var ADMIN_PASSWORD
                    │
                    ├─ Return { valid: true/false }
                    │
          ┌─────────┘
          │
    IF valid = true
          ├─ Execute pending action
          ├─ Show success toast
          └─ Close dialogs
    
    IF valid = false
          ├─ Show error toast
          ├─ Clear password input
          └─ Keep dialog open for retry
```

---

## 📱 UI Elements

### Password Dialog Component

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Konfirmasi Password                               │
│                                                     │
│  Masukkan password admin untuk melanjutkan operasi │
│  ini                                               │
│                                                     │
│  [Password input field - Hidden/dots]              │
│                                                     │
│  [Batal]                    [Verifikasi]           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Features:
- ✅ Password dots (tidak terlihat saat diketik)
- ✅ Auto-focus pada input field
- ✅ Enter key support (sama dengan klik Verifikasi)
- ✅ Batal button untuk abort
- ✅ Verifikasi button untuk submit

---

## ⏱️ Timing & Response

| Action | Expected Time | Notes |
|--------|---------------|-------|
| Dialog appears | < 100ms | Instant |
| Enter password | Variable | User input |
| Click Verifikasi | < 200ms | Form submit |
| Backend verification | < 500ms | Network + verify |
| Success: Execute | < 1s | Database update |
| Error: Show toast | < 1s | Error feedback |

---

## 🆘 If Something Goes Wrong

### Issue: "Password salah"
- ✓ Double-check password
- ✓ Make sure CAPS LOCK is off
- ✓ Try again
- ✓ Contact admin untuk password

### Issue: Dialog tidak muncul
- ✓ Check browser console (F12)
- ✓ Make sure form validation passed
- ✓ Refresh page dan try again

### Issue: Backend error / timeout
- ✓ Check internet connection
- ✓ Wait a few seconds dan try again
- ✓ Contact admin jika masalah persisten

### Issue: Operasi gagal setelah password benar
- ✓ Password verified tapi ada error di database
- ✓ Check error message di toast
- ✓ Lihat browser console untuk detail
- ✓ Contact admin untuk bantuan

---

## 🎓 Training Points for Admins

### Explain to Users:
1. **Why password?** "Untuk mencegah perubahan data tidak sengaja"
2. **When required?** "Saat update/delete/return kontrak"
3. **How to act?** "Masukkan password, klik Verifikasi"
4. **What if wrong?** "Coba lagi atau hubungi admin"
5. **Security reminder** "Jangan bagikan password"

### Demo Script:
```
1. Buka Contracts page
2. Pilih kontrak untuk di-edit
3. Ubah beberapa field (misal: Total Pinjaman)
4. Klik tombol "Simpan"
5. → Password dialog akan muncul
6. Masukkan password admin
7. Klik "Verifikasi"
8. → Kontrak berhasil diupdate
9. Toast success "Kontrak berhasil diperbarui"
```

---

## 📞 Support Checklist

Admin harus tahu:
- [ ] Password untuk production
- [ ] Bagaimana reset password jika lupa
- [ ] Bagaimana change password
- [ ] Who to contact untuk password issues
- [ ] Where to find documentation (file ini)

---

**Last Updated:** 2024
**Version:** 1.0
**Status:** Ready for Production ✅
