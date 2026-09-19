import crypto from 'crypto'

/**
 * Check if Razorpay credentials are configured via environment variables
 */
export function getPaymentGatewayConfig() {
  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.PAYMENT_KEY_ID || '').trim()
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || process.env.PAYMENT_KEY_SECRET || '').trim()

  const isConfigured = Boolean(keyId && keySecret)

  return {
    isConfigured,
    gateway: isConfigured ? 'razorpay' : 'none',
    keyId: isConfigured ? keyId : null,
    // Never send keySecret to frontend!
  }
}

/**
 * Independent backend calculation of InternSetu Platform Fee:
 * Platform Fee = 1% × Monthly Stipend × Number of Candidates Required
 */
export function calculatePlatformFee(monthlyStipend, candidatesRequired) {
  const stipendNum = Number(monthlyStipend)
  const candidatesNum = Number(candidatesRequired)

  if (isNaN(stipendNum) || stipendNum <= 0) {
    throw new Error('Monthly stipend must be a positive number greater than 0')
  }

  if (isNaN(candidatesNum) || candidatesNum < 1 || !Number.isInteger(candidatesNum)) {
    throw new Error('Number of candidates required must be an integer greater than or equal to 1')
  }

  const percentage = 1
  const fee = Math.round(stipendNum * candidatesNum * 0.01)

  return {
    monthlyStipend: stipendNum,
    candidatesRequired: candidatesNum,
    platformFeePercentage: percentage,
    platformFeeAmount: Math.max(1, fee),
    calculationFormula: `1% × ₹${stipendNum.toLocaleString('en-IN')} × ${candidatesNum}`,
  }
}

/**
 * Create order for posting platform fee with Razorpay
 */
export async function createPostingOrder({
  companyId,
  companyName,
  postingType,
  postingTitle,
  monthlyStipend,
  candidatesRequired,
}) {
  const feeData = calculatePlatformFee(monthlyStipend, candidatesRequired)
  const gatewayConfig = getPaymentGatewayConfig()

  if (!gatewayConfig.isConfigured) {
    throw new Error(
      'Razorpay credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables to enable payments.'
    )
  }

  const keySecret = (process.env.RAZORPAY_KEY_SECRET || process.env.PAYMENT_KEY_SECRET || '').trim()
  const authHeader = 'Basic ' + Buffer.from(`${gatewayConfig.keyId}:${keySecret}`).toString('base64')

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({
      amount: feeData.platformFeeAmount * 100, // paise
      currency: 'INR',
      receipt: `rcpt_${postingType}_${Date.now()}`.slice(0, 40),
      notes: {
        companyId: String(companyId),
        companyName: companyName || 'Company',
        postingType,
        postingTitle: (postingTitle || '').slice(0, 100),
        stipend: feeData.monthlyStipend,
        candidates: feeData.candidatesRequired,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[paymentService] Razorpay order creation failed:', errorText)
    throw new Error(`Razorpay order creation failed: ${response.statusText}`)
  }

  const razorpayOrder = await response.json()

  return {
    orderId: razorpayOrder.id,
    amount: feeData.platformFeeAmount,
    currency: 'INR',
    gateway: 'razorpay',
    keyId: gatewayConfig.keyId,
    feeBreakdown: feeData,
  }
}

/**
 * Verify Razorpay payment signature using HMAC-SHA256
 */
export function verifyPayment({ orderId, paymentId, signature }) {
  const gatewayConfig = getPaymentGatewayConfig()

  if (!gatewayConfig.isConfigured) {
    return {
      isValid: false,
      error: 'Razorpay credentials are not configured on the server.',
    }
  }

  if (!orderId || !paymentId || !signature) {
    return {
      isValid: false,
      error: 'Missing Razorpay orderId, paymentId, or signature',
    }
  }

  const keySecret = (process.env.RAZORPAY_KEY_SECRET || process.env.PAYMENT_KEY_SECRET || '').trim()
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  if (expectedSignature !== signature) {
    return {
      isValid: false,
      error: 'Invalid Razorpay payment signature. Payment verification failed.',
    }
  }

  return {
    isValid: true,
    paymentId,
    gateway: 'razorpay',
  }
}
