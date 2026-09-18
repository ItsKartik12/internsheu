import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import mongoose from 'mongoose'
import assert from 'assert'
import { connectDB } from '../config/db.js'
import User from '../models/User.js'
import TalentPipeline from '../models/TalentPipeline.js'
import ContactUnlock from '../models/ContactUnlock.js'
import {
  bulkUnlockShortlistedCandidates,
  unlockCandidateContact,
  getTalentPipelineCandidates,
} from '../controllers/candidateMatrixController.js'

async function runTest() {
  console.log('============================================================')
  console.log('TEST: BULK UNLOCK & ZERO-DUPLICATE-CHARGE VERIFICATION SUITE')
  console.log('============================================================')
  await connectDB()

  // 1. Create or fetch test company users
  const companyA = await User.findOneAndUpdate(
    { email: 'companya@internsetu.test' },
    { name: 'Company Alpha', role: 'industry', isActive: true },
    { upsert: true, new: true }
  )

  const companyB = await User.findOneAndUpdate(
    { email: 'companyb@internsetu.test' },
    { name: 'Company Beta', role: 'industry', isActive: true },
    { upsert: true, new: true }
  )

  // 2. Create or fetch test student candidates
  const student1 = await User.findOneAndUpdate(
    { email: 'student1@internsetu.test' },
    { name: 'Candidate Rachit', role: 'student', isActive: true, phone: '+91 91111 11111' },
    { upsert: true, new: true }
  )

  const student2 = await User.findOneAndUpdate(
    { email: 'student2@internsetu.test' },
    { name: 'Candidate Aarav', role: 'student', isActive: true, phone: '+91 92222 22222' },
    { upsert: true, new: true }
  )

  const student3 = await User.findOneAndUpdate(
    { email: 'student3@internsetu.test' },
    { name: 'Candidate Vishal', role: 'student', isActive: true, phone: '+91 93333 33333' },
    { upsert: true, new: true }
  )

  // Clean up any test artifacts for these specific test companies
  await TalentPipeline.deleteMany({ industryId: { $in: [companyA._id, companyB._id] } })
  await ContactUnlock.deleteMany({ companyId: { $in: [companyA._id, companyB._id] } })

  // Mock response helper
  const createMockRes = () => {
    let output = {}
    return {
      json: (data) => { output = data; return data },
      status: (code) => ({ json: (data) => { output = { ...data, statusCode: code }; return data } }),
      getOutput: () => output,
    }
  }

  // --- [A] Candidate moved to Shortlisted ---
  console.log('\n[A] Move Candidate 1 and Candidate 2 to Shortlisted stage in TalentPipeline')
  await TalentPipeline.create([
    { industryId: companyA._id, studentId: student1._id, stage: 'Shortlisted', poolName: 'Backend Intern', contactUnlocked: false },
    { industryId: companyA._id, studentId: student2._id, stage: 'Shortlisted', poolName: 'Frontend Intern', contactUnlocked: false },
  ])
  const initialShortlisted = await TalentPipeline.find({ industryId: companyA._id, stage: 'Shortlisted' })
  assert.strictEqual(initialShortlisted.length, 2, 'Two candidates marked Shortlisted')
  console.log('✓ [A] Candidates successfully moved to Shortlisted')

  // --- [B] Bulk unlock calculates pendingCount * 50 ---
  console.log('\n[B] Bulk unlock calculates pendingCount × ₹50 (2 pending * 50 = ₹100)')
  const resB = createMockRes()
  await bulkUnlockShortlistedCandidates({ user: companyA, body: {} }, resB, (err) => { throw err })
  const outB = resB.getOutput()
  assert.strictEqual(outB.totalCandidates, 2, 'Total shortlisted candidates = 2')
  assert.strictEqual(outB.newlyUnlockedCount, 2, 'Newly unlocked count = 2')
  assert.strictEqual(outB.amountPaid, 100, 'Calculated amount = ₹100')
  assert.strictEqual(outB.unlockedCandidates.length, 2, 'Returns 2 unmasked candidate objects')
  console.log('✓ [B] Correct bulk payment calculation: ₹100 for 2 pending candidates')

  // --- [C] ContactUnlock records are persisted ---
  console.log('\n[C] ContactUnlock records are persisted in MongoDB')
  const recordsC = await ContactUnlock.find({ companyId: companyA._id })
  assert.strictEqual(recordsC.length, 2, '2 ContactUnlock records exist in database')
  for (const r of recordsC) {
    assert.strictEqual(r.paymentStatus, 'PAID', 'Payment status is PAID')
    assert.strictEqual(r.amount, 50, 'Amount is ₹50')
  }
  console.log('✓ [C] Persistent ContactUnlock records verified in database')

  // --- [D] Re-running bulk unlock: amountPaid === 0, newlyUnlockedCount === 0 ---
  console.log('\n[D] Re-running bulk unlock charges ₹0 (Zero duplicate charge)')
  const resD = createMockRes()
  await bulkUnlockShortlistedCandidates({ user: companyA, body: {} }, resD, (err) => { throw err })
  const outD = resD.getOutput()
  assert.strictEqual(outD.newlyUnlockedCount, 0, 'Newly unlocked count must be 0')
  assert.strictEqual(outD.amountPaid, 0, 'Amount paid must be ₹0 on duplicate run')
  assert.strictEqual(outD.alreadyUnlockedCount, 2, 'Already unlocked count is 2')
  console.log('✓ [D] Re-run bulk unlock charged ₹0 and unlocked 0 additional candidates')

  // --- [E] Candidate leaves Shortlisted and later returns: amountPaid === 0 ---
  console.log('\n[E] Candidate leaves Shortlisted and later returns (Shortlisted -> Selected -> Matched -> Shortlisted)')
  await TalentPipeline.updateOne({ industryId: companyA._id, studentId: student1._id }, { stage: 'Selected' })
  await TalentPipeline.updateOne({ industryId: companyA._id, studentId: student1._id }, { stage: 'Matched' })
  await TalentPipeline.updateOne({ industryId: companyA._id, studentId: student1._id }, { stage: 'Shortlisted' })

  const resE = createMockRes()
  await bulkUnlockShortlistedCandidates({ user: companyA, body: {} }, resE, (err) => { throw err })
  const outE = resE.getOutput()
  assert.strictEqual(outE.amountPaid, 0, 'Returning candidate is not charged again (₹0)')
  console.log('✓ [E] Historical unlock persisted through stage transitions; ₹0 charged')

  // --- [F] Same candidate shortlisted under multiple opportunities: charged only once ---
  console.log('\n[F] Same candidate shortlisted under multiple pools/opportunities: charged only once')
  // Add Candidate 3 under opportunity 1 and opportunity 2
  await TalentPipeline.create([
    { industryId: companyA._id, studentId: student3._id, poolName: 'Opportunity AI', stage: 'Shortlisted' },
    { industryId: companyA._id, studentId: student3._id, poolName: 'Opportunity Cloud', stage: 'Shortlisted' },
  ])
  const resF = createMockRes()
  await bulkUnlockShortlistedCandidates({ user: companyA, body: {} }, resF, (err) => { throw err })
  const outF = resF.getOutput()
  // student3 is 1 unique candidate, student1 and student2 are already unlocked
  assert.strictEqual(outF.newlyUnlockedCount, 1, 'Only 1 unique candidate pending unlock (Candidate 3)')
  assert.strictEqual(outF.amountPaid, 50, 'Charged exactly ₹50 (1 unique candidate × ₹50, NOT per opportunity)')
  console.log('✓ [F] Candidate shortlisted across multiple opportunities charged only once (₹50)')

  // --- [G] Individual unlock followed by bulk unlock: second charge = ₹0 ---
  console.log('\n[G] Individual unlock followed by bulk unlock: second charge = ₹0')
  const student4 = await User.findOneAndUpdate(
    { email: 'student4@internsetu.test' },
    { name: 'Candidate Four', role: 'student', isActive: true, phone: '+91 94444 44444' },
    { upsert: true, new: true }
  )
  await TalentPipeline.create({ industryId: companyA._id, studentId: student4._id, stage: 'Shortlisted' })

  // Individual unlock first
  const resG1 = createMockRes()
  await unlockCandidateContact({ user: companyA, body: { studentId: student4._id } }, resG1, (err) => { throw err })
  const outG1 = resG1.getOutput()
  assert.strictEqual(outG1.totalFee, 50, 'Individual unlock charged ₹50')

  // Then bulk unlock
  const resG2 = createMockRes()
  await bulkUnlockShortlistedCandidates({ user: companyA, body: {} }, resG2, (err) => { throw err })
  const outG2 = resG2.getOutput()
  assert.strictEqual(outG2.amountPaid, 0, 'Bulk unlock charges ₹0 for candidate previously unlocked individually')
  console.log('✓ [G] Individual unlock followed by bulk unlock: ₹0 charged')

  // --- [H] Bulk unlock followed by individual unlock: second charge = ₹0 ---
  console.log('\n[H] Bulk unlock followed by individual unlock: second charge = ₹0')
  const resH = createMockRes()
  await unlockCandidateContact({ user: companyA, body: { studentId: student1._id } }, resH, (err) => { throw err })
  const outH = resH.getOutput()
  assert.strictEqual(outH.totalFee, 0, 'Individual unlock charges ₹0 for candidate previously unlocked via bulk unlock')
  console.log('✓ [H] Bulk unlock followed by individual unlock: ₹0 charged')

  // --- [I] Company B cannot use Company A\'s unlock ---
  console.log('\n[I] Company B cannot use Company A\'s unlock (Company isolation)')
  await TalentPipeline.create({
    industryId: companyB._id,
    studentId: student1._id,
    stage: 'Shortlisted',
    contactUnlocked: false,
  })

  const resI = createMockRes()
  await getTalentPipelineCandidates({ user: companyB, query: { stage: 'Shortlisted' } }, resI, (err) => { throw err })
  const outI = resI.getOutput()
  const bCandidate = outI.candidates.find((c) => c.studentId.toString() === student1._id.toString())
  assert.strictEqual(bCandidate.contactUnlocked, false, 'Candidate contact is LOCKED for Company B')
  assert(bCandidate.email.includes('*'), 'Candidate email is masked for Company B')
  console.log('✓ [I] Company B isolation verified: contact remains locked for Company B')

  // --- [J] No duplicate ContactUnlock records exist for companyId + candidateId ---
  console.log('\n[J] No duplicate ContactUnlock records exist for companyId + candidateId')
  const allCompanyAUnlocks = await ContactUnlock.find({ companyId: companyA._id }).lean()
  const uniqueCandidateKeys = new Set()
  for (const u of allCompanyAUnlocks) {
    const key = `${u.companyId}_${u.candidateId}`
    assert(!uniqueCandidateKeys.has(key), `Duplicate ContactUnlock found for key: ${key}`)
    uniqueCandidateKeys.add(key)
  }
  assert.strictEqual(uniqueCandidateKeys.size, allCompanyAUnlocks.length, 'All ContactUnlock records are strictly unique')
  console.log(`✓ [J] Compound uniqueness verified: exactly ${uniqueCandidateKeys.size} unique records, 0 duplicates`)

  console.log('\n============================================================')
  console.log('ALL BULK UNLOCK & DUPLICATE PREVENTION VERIFICATIONS PASSED!')
  console.log('============================================================\n')
  await mongoose.disconnect()
}

runTest().catch((err) => {
  console.error('Test failed with error:', err)
  process.exit(1)
})
