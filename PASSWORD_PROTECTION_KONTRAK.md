# Feature: Password Protection untuk Pembaruan Kontrak

## 📋 Konsep

Setiap pembaruan data kontrak harus dilindungi dengan password untuk meningkatkan keamanan dan mencegah perubahan tidak sengaja.

## 🎯 Scope

Operasi yang memerlukan password:
- ✅ **CREATE** - Buat kontrak baru
- ✅ **UPDATE** - Edit data kontrak (total pinjaman, tenor, dll)
- ✅ **DELETE** - Hapus kontrak
- ✅ **RETURN** - Tandai kontrak sebagai macet/return

## 🔧 Implementasi Teknis

### Fase 1: Frontend UI (IMPLEMENTED)

**File:** `src/pages/Contracts.tsx`

#### 1. State Management
```typescript
const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
const [passwordInput, setPasswordInput] = useState("");
const [pendingAction, setPendingAction] = useState<"update" | "delete" | "return" | null>(null);
```

#### 2. Password Verification Function
```typescript
const verifyPassword = async (password: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-admin-password', {
      body: { password },
    });
    
    if (error) {
      console.error('Password verification error:', error);
      return false;
    }
    
    return data?.valid === true;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};
```

#### 3. Password Dialog Handler
```typescript
const handlePasswordSubmit = async () => {
  if (!passwordInput.trim()) {
    toast.error("Password harus diisi");
    return;
  }

  try {
    const isValid = await verifyPassword(passwordInput);
    if (!isValid) {
      toast.error("Password salah");
      setPasswordInput("");
      return;
    }

    // Password benar, lanjutkan action
    setPasswordDialogOpen(false);
    setPasswordInput("");

    if (pendingAction === "update") {
      await executeContractUpdate();
    } else if (pendingAction === "delete") {
      await executeContractDelete();
    } else if (pendingAction === "return") {
      await executeContractReturn();
    }
  } catch (error) {
    console.error('Password verification error:', error);
    toast.error("Gagal verifikasi password");
  }
};
```

#### 4. Modified handleSubmit (UPDATE KONTRAK)
```typescript
const handleSubmit = async () => {
  // ... validation code ...
  
  // Jika validasi berhasil, tampilkan password dialog
  setPendingAction("update");
  setPasswordDialogOpen(true);
};

// Execution setelah password verified
const executeContractUpdate = async () => {
  // ... kontrak update logic ...
};
```

#### 5. Modified handleDelete (DELETE KONTRAK)
```typescript
const handleDeleteWithPassword = async () => {
  if (!selectedContract) return;
  
  // Tampilkan password dialog
  setPendingAction("delete");
  setPasswordDialogOpen(true);
};

const executeContractDelete = async () => {
  if (!selectedContract) return;
  try {
    await deleteContract.mutateAsync(selectedContract.id);
    toast.success("Kontrak berhasil dihapus");
    setDeleteDialogOpen(false);
    setSelectedContract(null);
  } catch (error) {
    console.error('Delete contract error:', error);
    const msg = error instanceof Error ? error.message : 'Gagal menghapus kontrak';
    toast.error(msg);
  }
};
```

#### 6. Modified handleReturn (RETURN KONTRAK)
```typescript
const handleReturnWithPassword = async () => {
  if (!selectedContract) return;
  
  // Tampilkan password dialog
  setPendingAction("return");
  setPasswordDialogOpen(true);
};

const executeContractReturn = async () => {
  if (!selectedContract) return;
  try {
    // ... return logic ...
  } catch (error) {
    // ... error handling ...
  }
};
```

### Fase 2: Backend Authentication (PENDING)

**Implementasi Options:**

#### Option A: Supabase Edge Function (RECOMMENDED)
```typescript
// supabase/functions/verify-admin-password/index.ts
import { serve } from "https://deno.land/std@0.132.0/http/server.ts"

serve(async (req) => {
  if (req.method === 'POST') {
    const { password } = await req.json()
    
    // Get admin password dari environment variable
    const adminPassword = Deno.env.get('ADMIN_PASSWORD')
    
    // Hash comparison
    const isValid = password === adminPassword
    
    return new Response(
      JSON.stringify({ valid: isValid }),
      { headers: { "Content-Type": "application/json" } }
    )
  }
  
  return new Response("Not Found", { status: 404 })
})
```

#### Option B: RPC Function (Supabase)
```sql
-- Create RPC function
CREATE OR REPLACE FUNCTION verify_admin_password(password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  admin_password TEXT;
BEGIN
  -- Get admin password dari secure setting
  admin_password := current_setting('app.admin_password', false);
  
  RETURN password = admin_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Option C: Simple Hash-based (Less Secure)
```typescript
import bcrypt from 'bcrypt';

const verifyPassword = async (password: string): Promise<boolean> => {
  // Hash in environment
  const hashedPassword = process.env.ADMIN_PASSWORD_HASH;
  
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    return false;
  }
};
```

### Fase 3: Password Dialog Component

**File:** `src/pages/Contracts.tsx` (dalam JSX)

```tsx
{/* Password Confirmation Dialog */}
<Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Konfirmasi Password</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Masukkan password admin untuk melanjutkan operasi ini
      </p>
      <Input
        type="password"
        placeholder="Masukkan password..."
        value={passwordInput}
        onChange={(e) => setPasswordInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
      />
    </div>
    
    <DialogFooter>
      <Button 
        variant="outline" 
        onClick={() => {
          setPasswordDialogOpen(false);
          setPasswordInput("");
          setPendingAction(null);
        }}
      >
        Batal
      </Button>
      <Button onClick={handlePasswordSubmit}>
        Verifikasi
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## 📊 Flow Diagram

```
User membuka form kontrak / klik delete / klik return
        ↓
Form validation (client-side)
        ↓
Jika OK → Tampilkan Password Dialog
        ↓
User masukkan password
        ↓
verifyPassword() → Call backend (Edge Function/RPC)
        ↓
Backend verify password
        ↓
Jika VALID → Lanjutkan operasi (create/update/delete/return)
        ↓
Jika INVALID → Toast error "Password salah"
```

## 🧪 Testing Checklist

- [ ] Dialog password muncul saat klik "Update" kontrak
- [ ] Dialog password muncul saat klik "Delete" kontrak
- [ ] Dialog password muncul saat klik "Return" kontrak
- [ ] Password salah → error toast
- [ ] Password benar → operasi berjalan
- [ ] Klik "Batal" → dialog tutup, operasi dibatalkan
- [ ] Enter key → submit password
- [ ] Backend verification bekerja

## 🔒 Security Considerations

1. **Password Storage**
   - ✓ Store di environment variable (tidak di code)
   - ✓ Use strong password (min 12 chars, mix alphanumeric + special)
   - ✓ Consider hashing jika password shared

2. **Frontend Security**
   - ✓ Don't log password di console
   - ✓ Clear password input after submission
   - ✓ Input type="password" untuk hide dari screen reader

3. **Backend Security**
   - ✓ Use HTTPS only (Supabase handle ini)
   - ✓ Rate limit password verification attempts
   - ✓ Log failed attempts untuk security audit

4. **Best Practices**
   - ✓ Password protected hanya untuk critical operations
   - ✓ User role-based access control (tidak semua admin bisa update)
   - ✓ Audit log setiap operasi dengan password

## 🚀 Deployment Steps

1. **Backend Setup**
   - Create Edge Function `verify-admin-password`
   - Set environment variable `ADMIN_PASSWORD`

2. **Frontend Update**
   - Update Contracts.tsx dengan password dialog
   - Test dengan backend

3. **Documentation**
   - Brief users tentang new password requirement
   - Bagikan admin password dengan authorized personnel

## 📝 Future Enhancements

- [ ] Two-factor authentication (OTP via SMS/Email)
- [ ] Role-based password (different password per role)
- [ ] Password expiration & rotation policy
- [ ] Detailed audit logging dengan timestamp & user info
- [ ] Biometric authentication support (fingerprint, face recognition)

## 🚀 Deployment Status

🔄 **IN PROGRESS**
- [x] Frontend structure implemented
- [ ] Backend verification function pending
- [ ] Password dialog UI pending
- [ ] Testing pending
- [ ] Documentation pending

## 📌 Current Status

**Phase 1 (Frontend):** ✅ DONE
- State management added
- verifyPassword() function created
- handlePasswordSubmit() logic implemented
- handleSubmit() modified to show password dialog
- executeContractUpdate() prepared

**Phase 2 (Backend):** ⏳ PENDING
- Create Edge Function or RPC
- Setup environment variable
- Test password verification

**Phase 3 (UI):** ⏳ PENDING
- Add password dialog component
- Update click handlers to use new flow
- Test UI flow

## 🔗 Related Files

- `src/pages/Contracts.tsx` - Main implementation
- `supabase/functions/verify-admin-password/index.ts` - Backend (pending)
- `.env.local` - Environment variables (setup needed)
