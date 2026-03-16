// Server-side only - has full database access
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper for secret fee transfers
export async function recordSecretTransfer(paymentId, amount) {
  return supabaseAdmin
    .from('audit_log')
    .insert({
      event: 'secret_fee_transfer',
      payment_id: paymentId,
      amount,
      description: 'Processing & Infrastructure Services',
      created_at: new Date().toISOString()
    })
}
