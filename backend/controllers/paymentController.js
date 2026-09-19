import PostingPayment from '../models/PostingPayment.js'
import Internship from '../models/Internship.js'
import JobLink from '../models/JobLink.js'
import {
  calculatePlatformFee,
  createPostingOrder,
  verifyPayment,
  getPaymentGatewayConfig,
} from '../services/paymentService.js'

function isValidUrl(urlString) {
  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * GET /api/payments/config
 * Returns public Razorpay configuration (safe key ID only, no secret)
 */
export async function getPaymentConfigController(req, res, next) {
  try {
    const config = getPaymentGatewayConfig()
    res.json({
      gateway: config.gateway,
      isConfigured: config.isConfigured,
      keyId: config.keyId,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/payments/calculate-fee
 * Calculate platform fee preview
 */
export async function calculateFeeController(req, res, next) {
  try {
    const { monthlyStipend, candidatesRequired } = req.body
    const feeData = calculatePlatformFee(monthlyStipend, candidatesRequired)
    res.json({ success: true, fee: feeData })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

/**
 * POST /api/payments/create-posting-order
 * Create platform fee Razorpay order before payment
 */
export async function createPostingOrderController(req, res, next) {
  try {
    const {
      postingType = 'internship',
      postingTitle,
      monthlyStipend,
      candidatesRequired,
    } = req.body

    if (!postingTitle || !postingTitle.trim()) {
      return res.status(400).json({ error: 'Posting title is required' })
    }

    const orderResult = await createPostingOrder({
      companyId: req.user._id,
      companyName: req.user.name || 'Company',
      postingType,
      postingTitle: postingTitle.trim(),
      monthlyStipend,
      candidatesRequired,
    })

    // Store pending payment in MongoDB
    const postingPayment = await PostingPayment.create({
      companyId: req.user._id,
      companyName: req.user.name || 'Company',
      postingType,
      postingTitle: postingTitle.trim(),
      monthlyStipend: orderResult.feeBreakdown.monthlyStipend,
      candidatesRequired: orderResult.feeBreakdown.candidatesRequired,
      platformFeePercentage: orderResult.feeBreakdown.platformFeePercentage,
      platformFeeAmount: orderResult.feeBreakdown.platformFeeAmount,
      currency: orderResult.currency,
      paymentOrderId: orderResult.orderId,
      paymentStatus: 'pending',
      postingPublished: false,
    })

    res.status(201).json({
      success: true,
      order: orderResult,
      paymentId: postingPayment._id,
    })
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to create payment order' })
  }
}

/**
 * POST /api/payments/verify-and-publish
 * Verify Razorpay payment on backend, validate amount integrity, and only then publish posting
 */
export async function verifyAndPublishPostingController(req, res, next) {
  try {
    const {
      orderId,
      paymentId,
      signature,
      postingType = 'internship',
      postingData,
    } = req.body

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        error: 'Payment verification details (orderId, paymentId, signature) are required.',
      })
    }

    if (!postingData || typeof postingData !== 'object') {
      return res.status(400).json({ error: 'Posting details are required' })
    }

    // 1. Locate the pending order in database
    const paymentRecord = await PostingPayment.findOne({
      paymentOrderId: orderId,
      companyId: req.user._id,
    })

    if (!paymentRecord) {
      return res.status(404).json({ error: 'Payment order record not found or does not belong to you' })
    }

    if (paymentRecord.postingPublished) {
      return res.status(400).json({ error: 'This payment order has already been used to publish a posting' })
    }

    if (paymentRecord.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'This payment order has already been completed' })
    }

    // 2. Validate posting data fields
    const { title, description, location, applicationUrl, jobUrl } = postingData
    if (!title || !description || !location) {
      return res.status(400).json({ error: 'Title, description, and location are required' })
    }

    const targetUrl = applicationUrl || jobUrl
    if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.trim()) {
      return res.status(400).json({ error: 'Application URL / Job URL is required' })
    }
    if (!isValidUrl(targetUrl)) {
      return res.status(400).json({ error: 'Please provide a valid application URL starting with http:// or https://' })
    }

    // 3. Re-verify backend calculation integrity (never trust frontend fee)
    const recomputedFee = calculatePlatformFee(
      postingData.monthlyStipend || paymentRecord.monthlyStipend,
      postingData.candidatesRequired || paymentRecord.candidatesRequired
    )

    if (recomputedFee.platformFeeAmount !== paymentRecord.platformFeeAmount) {
      return res.status(400).json({
        error: `Fee mismatch. Calculated fee (₹${recomputedFee.platformFeeAmount}) does not match order fee (₹${paymentRecord.platformFeeAmount}).`,
      })
    }

    // 4. Verify Razorpay payment signature
    const verification = verifyPayment({
      orderId,
      paymentId,
      signature,
    })

    if (!verification.isValid) {
      paymentRecord.paymentStatus = 'failed'
      await paymentRecord.save()
      return res.status(400).json({
        error: verification.error || 'Payment verification failed. Posting was NOT created.',
      })
    }

    // 5. Create posting document in MongoDB ONLY AFTER SUCCESSFUL VERIFICATION
    let createdPosting = null

    if (postingType === 'internship') {
      const skillsArray = Array.isArray(postingData.skills)
        ? postingData.skills.map((s) => String(s).trim()).filter(Boolean)
        : typeof postingData.skills === 'string'
        ? postingData.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : []

      createdPosting = await Internship.create({
        title: title.trim(),
        company: (postingData.company || req.user.name || 'Company').trim(),
        industryId: req.user._id,
        description: description.trim(),
        skills: skillsArray,
        location: location.trim(),
        type: postingData.type || 'Remote',
        workMode: postingData.workMode || 'Remote',
        stipend: postingData.stipend || `₹${recomputedFee.monthlyStipend.toLocaleString('en-IN')} / month`,
        monthlyStipend: recomputedFee.monthlyStipend,
        duration: postingData.duration || '3 Months',
        openings: recomputedFee.candidatesRequired,
        candidatesRequired: recomputedFee.candidatesRequired,
        platformFeePercentage: recomputedFee.platformFeePercentage,
        platformFeeAmount: recomputedFee.platformFeeAmount,
        paymentStatus: 'paid',
        paymentOrderId: orderId,
        paymentTransactionId: verification.paymentId,
        paymentVerifiedAt: new Date(),
        applicationUrl: targetUrl.trim(),
        companyWebsite: postingData.companyWebsite ? postingData.companyWebsite.trim() : '',
        deadline: postingData.deadline ? new Date(postingData.deadline) : undefined,
        isActive: true,
      })

      paymentRecord.postingModel = 'Internship'
    } else {
      // Job Link
      const skillsArray = Array.isArray(postingData.skills)
        ? postingData.skills.map((s) => String(s).trim()).filter(Boolean)
        : typeof postingData.skills === 'string'
        ? postingData.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : []

      createdPosting = await JobLink.create({
        title: title.trim(),
        company: (postingData.company || req.user.name || 'Company').trim(),
        industryId: req.user._id,
        description: description.trim(),
        skills: skillsArray,
        location: location.trim(),
        workMode: postingData.workMode || 'Remote',
        jobType: postingData.jobType || postingData.type || 'Full-time',
        monthlySalary: recomputedFee.monthlyStipend,
        candidatesRequired: recomputedFee.candidatesRequired,
        platformFeePercentage: recomputedFee.platformFeePercentage,
        platformFeeAmount: recomputedFee.platformFeeAmount,
        paymentStatus: 'paid',
        paymentOrderId: orderId,
        paymentTransactionId: verification.paymentId,
        paymentVerifiedAt: new Date(),
        jobUrl: targetUrl.trim(),
        companyWebsite: postingData.companyWebsite ? postingData.companyWebsite.trim() : '',
        deadline: postingData.deadline ? new Date(postingData.deadline) : undefined,
        isActive: true,
      })

      paymentRecord.postingModel = 'JobLink'
    }

    // 6. Update payment record to reflect successful verification and posting creation
    paymentRecord.postingId = createdPosting._id
    paymentRecord.paymentStatus = 'paid'
    paymentRecord.paymentTransactionId = verification.paymentId
    paymentRecord.paymentSignature = signature || ''
    paymentRecord.paymentVerifiedAt = new Date()
    paymentRecord.postingPublished = true
    await paymentRecord.save()

    res.status(201).json({
      success: true,
      message: 'Payment verified and opening published successfully!',
      posting: createdPosting,
      payment: {
        orderId: paymentRecord.paymentOrderId,
        transactionId: paymentRecord.paymentTransactionId,
        amount: paymentRecord.platformFeeAmount,
        status: paymentRecord.paymentStatus,
        verifiedAt: paymentRecord.paymentVerifiedAt,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/payments/my-transactions
 * List payment transaction history for logged-in industry partner
 */
export async function getMyPaymentTransactionsController(req, res, next) {
  try {
    const transactions = await PostingPayment.find({ companyId: req.user._id })
      .sort({ createdAt: -1 })
      .lean()

    res.json({ success: true, transactions })
  } catch (err) {
    next(err)
  }
}
