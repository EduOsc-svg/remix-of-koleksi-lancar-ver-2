// supabase/functions/verify-admin-password/index.ts
// 
// Edge Function untuk verifikasi admin password
// Digunakan oleh frontend Contracts.tsx untuk mengamankan operasi sensitif
//
// Deploy: supabase functions deploy verify-admin-password

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const { password } = await req.json();
    
    // Validate input
    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ valid: false }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    // Get admin password dari environment variable
    const adminPassword = Deno.env.get('ADMIN_PASSWORD');
    
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable not set');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          valid: false 
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    // Simple string comparison (Development)
    // TODO: Gunakan bcrypt untuk production dengan constant-time comparison
    const isValid = password === adminPassword;
    
    // Log verification attempt (untuk audit trail)
    console.log(`[Password Verification] Attempt at ${new Date().toISOString()}, Valid: ${isValid}`);
    
    return new Response(
      JSON.stringify({ 
        valid: isValid,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        } 
      }
    );
  } catch (error) {
    console.error('Error in verify-admin-password:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        valid: false 
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
})
