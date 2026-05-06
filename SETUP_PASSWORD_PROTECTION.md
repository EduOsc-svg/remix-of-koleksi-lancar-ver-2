# 🚀 Setup Edge Function & Environment Variables

## Prerequisites Checklist
- [ ] Supabase Project sudah dibuat
- [ ] Access ke Supabase Dashboard
- [ ] Admin password yang aman (min 12 karakter, alphanumeric + special)

---

## Step 1: Create Edge Function di Supabase Dashboard

### Option A: Via Supabase Dashboard UI (RECOMMENDED)

1. **Buka Supabase Dashboard**
   - Login ke https://app.supabase.com
   - Select project anda

2. **Navigate ke Edge Functions**
   - Klik menu "Edge Functions" di sidebar kiri
   - Klik tombol "Create a new function"

3. **Create New Function**
   - Function name: `verify-admin-password`
   - Authentication: Select appropriate auth policy
   - Klik "Create function"

4. **Copy-Paste Function Code**
   - Buka file: `supabase/functions/verify-admin-password/index.ts`
   - Copy semua kode
   - Paste ke editor di Supabase Dashboard
   - Klik "Deploy"

### Option B: Via CLI (ADVANCED)

```bash
# 1. Install Supabase CLI (jika belum)
npm install -g supabase

# 2. Navigate ke project root
cd /opt/Real_Project/koleksi-lancar-ver-2

# 3. Login ke Supabase
supabase login

# 4. Link project
supabase link --project-ref your-project-ref

# 5. Deploy function
supabase functions deploy verify-admin-password

# 6. View logs
supabase functions logs verify-admin-password
```

---

## Step 2: Set Environment Variable

### Via Supabase Dashboard

1. **Settings → Edge Functions**
   - Klik gear icon di edge function yang baru dibuat
   - Klik "Environment variables" tab

2. **Add New Variable**
   - Variable name: `ADMIN_PASSWORD`
   - Value: `[PASSWORD_YANG_AMAN]`
   - Contoh: `Admin@Koleksi2024!Secure`
   - **⚠️ PENTING:** Ingat password ini! Akan digunakan untuk verify semua operasi

3. **Save**
   - Klik "Save"
   - Function akan auto-redeploy dengan env var baru

### Environment Variable Best Practices

✅ DO:
- Use strong password (min 12 chars)
- Include uppercase + lowercase + numbers + special chars
- Store di password manager (1Password, Bitwarden, dll)
- Change password regularly (setiap 3 bulan)
- Use different password per environment (dev/staging/prod)

❌ DON'T:
- Share password di chat/email/version control
- Use simple password seperti "admin123"
- Commit password ke Git
- Hardcode password di code

---

## Step 3: Verify Function is Working

### Test via cURL

```bash
# Test dengan password SALAH
curl -X POST http://localhost:54321/functions/v1/verify-admin-password \
  -H "Content-Type: application/json" \
  -d '{"password":"WrongPassword"}'

# Expected response:
# {"valid":false,"timestamp":"2024-01-15T10:30:00Z"}

# ---

# Test dengan password BENAR
curl -X POST http://localhost:54321/functions/v1/verify-admin-password \
  -H "Content-Type: application/json" \
  -d '{"password":"Admin@Koleksi2024!Secure"}'

# Expected response:
# {"valid":true,"timestamp":"2024-01-15T10:30:00Z"}
```

### Test via Frontend

1. Open development console (F12)
2. Navigate to Contracts page
3. Klik tombol "Update/Delete/Return" kontrak
4. Password dialog akan muncul
5. Enter password yang benar
6. Jika berhasil → operasi berjalan
7. Jika gagal → error toast "Password salah"

---

## Step 4: Configure untuk Development

### Local Development Setup

**File: `.env.local`**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Testing di Development:**
```bash
# 1. Start dev server
npm run dev

# 2. Testing password protection dengan:
# - Correct password → operasi berhasil
# - Wrong password → error toast
# - Empty password → validation error
# - Cancel dialog → operasi dibatalkan
```

---

## Step 5: Security Hardening (OPTIONAL)

### Upgrade dari Plain Text ke Bcrypt

Untuk production, gunakan bcrypt untuk hash password:

**Updated Edge Function dengan Bcrypt:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts"

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200 });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405 }
    );
  }

  try {
    const { password } = await req.json();
    
    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 400 }
      );
    }
    
    const hashedPassword = Deno.env.get('ADMIN_PASSWORD_HASH');
    
    if (!hashedPassword) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error', valid: false }),
        { status: 500 }
      );
    }
    
    // Compare dengan bcrypt (constant-time comparison)
    const isValid = await bcrypt.compare(password, hashedPassword);
    
    console.log(`[Password Verification] ${isValid ? 'SUCCESS' : 'FAILED'}`);
    
    return new Response(
      JSON.stringify({ valid: isValid }),
      { 
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" }
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', valid: false }),
      { status: 500 }
    );
  }
})
```

**Setup Bcrypt Hash:**

```bash
# 1. Generate bcrypt hash untuk password
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('Admin@Koleksi2024!Secure', 10))"

# Output example:
# $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36jNLH7G

# 2. Gunakan hash ini sebagai env var
# Variable: ADMIN_PASSWORD_HASH
# Value: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36jNLH7G
```

### Add Rate Limiting

**Tambahkan rate limiting untuk prevent brute force:**

```typescript
// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { attempts: number; timestamp: number }>();

const checkRateLimit = (ip: string): boolean => {
  const limit = rateLimitMap.get(ip);
  const now = Date.now();
  
  if (!limit) {
    rateLimitMap.set(ip, { attempts: 1, timestamp: now });
    return true;
  }
  
  // Reset setelah 15 menit
  if (now - limit.timestamp > 15 * 60 * 1000) {
    rateLimitMap.set(ip, { attempts: 1, timestamp: now });
    return true;
  }
  
  // Max 5 attempts per 15 minutes
  if (limit.attempts >= 5) {
    return false;
  }
  
  limit.attempts++;
  return true;
};

// Dalam serve function:
const clientIp = req.headers.get('x-forwarded-for') || 'unknown';

if (!checkRateLimit(clientIp)) {
  return new Response(
    JSON.stringify({ error: 'Too many attempts. Try again later.', valid: false }),
    { status: 429 }
  );
}
```

### Add Audit Logging

**Log setiap password attempt ke database:**

```typescript
// Insert ke audit_log table
await supabase
  .from('audit_logs')
  .insert({
    action: 'password_verification',
    success: isValid,
    ip_address: clientIp,
    timestamp: new Date().toISOString(),
  });
```

---

## Step 6: Deployment Checklist

### Development
- [ ] Edge function created di Supabase
- [ ] ADMIN_PASSWORD env var set
- [ ] Password verification tested dengan cURL
- [ ] Frontend password dialog tested
- [ ] Correct password → operasi berhasil
- [ ] Wrong password → error toast

### Staging
- [ ] Deploy ke staging environment
- [ ] Full password flow tested dengan actual data
- [ ] No errors di browser console
- [ ] No errors di Supabase edge function logs
- [ ] Response time acceptable (<500ms)

### Production
- [ ] Review password strength
- [ ] Backup password di password manager
- [ ] Notify admin users tentang new requirement
- [ ] Monitor edge function logs first 24 hours
- [ ] Have rollback plan (bisa disable password check)

---

## Troubleshooting

### Issue: "Password verification error" di console

**Causes:**
- Edge Function not deployed
- ADMIN_PASSWORD env var not set
- Network error ke Supabase

**Solutions:**
```bash
# 1. Check function status
supabase functions list

# 2. View function logs
supabase functions logs verify-admin-password

# 3. Test function directly
curl -X POST https://your-project.supabase.co/functions/v1/verify-admin-password \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"password":"test"}'
```

### Issue: CORS error

**Cause:** Edge Function tidak allow CORS

**Solution:** Pastikan response include CORS headers:
```typescript
headers: { 
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json"
}
```

### Issue: Function timeout

**Cause:** Function response > 30 seconds

**Solution:** 
- Pastikan password comparison sederhana (tidak ada database query)
- Jika perlu database query, use connection pooling

### Issue: 500 error "Server configuration error"

**Cause:** ADMIN_PASSWORD env var tidak set

**Solution:**
1. Go to Supabase Dashboard
2. Edge Functions → Select function → Settings
3. Add ADMIN_PASSWORD env var
4. Redeploy function

---

## Monitoring & Maintenance

### Check Function Logs

```bash
# Real-time logs
supabase functions logs verify-admin-password --follow

# With timestamp
supabase functions logs verify-admin-password -n 100

# Export logs untuk analysis
supabase functions logs verify-admin-password > logs.txt
```

### Monthly Tasks

- [ ] Review password strength criteria
- [ ] Rotate admin password (setiap 3 bulan)
- [ ] Check edge function performance metrics
- [ ] Review audit logs untuk suspicious activity
- [ ] Update password requirements jika needed

### Backup & Recovery

```bash
# Backup current env vars
supabase secrets list > backup-secrets.txt

# If password lost/compromised
# 1. Generate new password
# 2. Update ADMIN_PASSWORD env var
# 3. Notify all admins tentang password baru
# 4. Wait untuk redeploy (~30 seconds)
```

---

## Dokumentasi

- **Implementation:** `PASSWORD_PROTECTION_IMPLEMENTATION_COMPLETE.md`
- **Feature Design:** `PASSWORD_PROTECTION_KONTRAK.md`
- **Edge Function Code:** `supabase/functions/verify-admin-password/index.ts`

---

## Support & Questions

Jika ada issues:
1. Check Supabase logs: `supabase functions logs`
2. Check browser console: F12 → Console tab
3. Test edge function: cURL test di atas
4. Review environment variables di Supabase Dashboard
