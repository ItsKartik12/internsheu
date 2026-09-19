import assert from 'assert'
import crypto from 'crypto'
import { calculatePlatformFee, verifyPayment } from '../services/paymentService.js'

console.log('--- RUNNING MONETIZATION & PAYMENT VERIFICATION SUITE ---')

// 1. Dynamic Fee Calculation Tests
console.log('\n[TEST 1] Calculating Platform Fees (1% × stipend × candidates):')

const test1 = calculatePlatformFee(25000, 4)
console.log(`- 25,000 × 4 → ₹${test1.platformFeeAmount} (Expected 1000)`)
assert.strictEqual(test1.platformFeeAmount, 1000, 'Expected ₹1,000 for ₹25,000 × 4')

const test2 = calculatePlatformFee(20000, 2)
console.log(`- 20,000 × 2 → ₹${test2.platformFeeAmount} (Expected 400)`)
assert.strictEqual(test2.platformFeeAmount, 400, 'Expected ₹400 for ₹20,000 × 2')

const test3 = calculatePlatformFee(30000, 10)
console.log(`- 30,000 × 10 → ₹${test3.platformFeeAmount} (Expected 3000)`)
assert.strictEqual(test3.platformFeeAmount, 3000, 'Expected ₹3,000 for ₹30,000 × 10')

// 2. Reject Invalid Inputs
console.log('\n[TEST 2] Rejecting Invalid / Negative / Decimal Inputs:')

// stipend <= 0
assert.throws(() => calculatePlatformFee(0, 4), /greater than 0/)
console.log('- Rejected stipend = 0')

assert.throws(() => calculatePlatformFee(-25000, 4), /greater than 0/)
console.log('- Rejected stipend = -25000')

// candidatesRequired < 1
assert.throws(() => calculatePlatformFee(25000, 0), /greater than or equal to 1/)
console.log('- Rejected candidates = 0')

assert.throws(() => calculatePlatformFee(25000, -2), /greater than or equal to 1/)
console.log('- Rejected candidates = -2')

// decimal candidates
assert.throws(() => calculatePlatformFee(25000, 2.5), /must be an integer/)
console.log('- Rejected decimal candidates = 2.5')

// 3. HMAC-SHA256 Signature Verification Test
console.log('\n[TEST 3] Razorpay Signature Verification:')

const dummySecret = 'test_secret_key_antigravity_12345'
process.env.RAZORPAY_KEY_ID = 'rzp_test_antigravity'
process.env.RAZORPAY_KEY_SECRET = dummySecret

const orderId = 'order_PX98cf32c7'
const paymentId = 'pay_TX78901234'
const validSignature = crypto
  .createHmac('sha256', dummySecret)
  .update(`${orderId}|${paymentId}`)
  .digest('hex')

const validResult = verifyPayment({
  orderId,
  paymentId,
  signature: validSignature,
})
assert.strictEqual(validResult.isValid, true, 'Valid signature must pass')
console.log('- Valid Razorpay signature accepted')

const tamperedResult = verifyPayment({
  orderId,
  paymentId,
  signature: 'fake_tampered_signature_hex_value',
})
assert.strictEqual(tamperedResult.isValid, false, 'Tampered signature must be rejected')
console.log('- Tampered / manipulated signature rejected')

// 4. Missing Credentials Behavior
console.log('\n[TEST 4] Missing Credentials Handling:')
delete process.env.RAZORPAY_KEY_ID
delete process.env.RAZORPAY_KEY_SECRET

const missingResult = verifyPayment({
  orderId,
  paymentId,
  signature: validSignature,
})
assert.strictEqual(missingResult.isValid, false, 'Should fail verification if keys missing')
console.log('- Rejected unconfigured environment gracefully')

console.log('\nALL MONETIZATION & PAYMENT UNIT TESTS PASSED!')
