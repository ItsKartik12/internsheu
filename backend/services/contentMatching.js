import mongoose from 'mongoose'
import User from '../models/User.js'
import CuratedContent from '../models/CuratedContent.js'

// ────────────────────────────────────────────────────────────────────────
// There is no stored reference (no `contentIds` array on User, no `userId`
// on CuratedContent) between these two collections. A user doesn't own a
// fixed list of videos — the video catalog grows independently of any one
// user, and the same video should appear for every user in that field.
//
// So instead of a foreign key, the relationship is a QUERY-TIME MATCH:
// "find content whose fieldMarks array contains this user's fieldMark".
// This is the idiomatic MongoDB shape for a broadcast-style many-to-many
// (many users share a field, one video can serve many fields) — a join
// collection would be pure overhead here since neither side needs to store
// per-pair metadata (no "watched at", no "assigned by").
// ────────────────────────────────────────────────────────────────────────

/**
 * Simple version: two sequential queries. Easiest to read and to unit test;
 * use this in most route handlers.
 *
 * @param {string} userId
 * @returns {Promise<{ user: object, matchedContent: object[] } | null>}
 */
export async function getUserWithMatchedContent(userId) {
  const user = await User.findById(userId).lean()
  if (!user) return null

  const matchedContent = await CuratedContent.find({
    fieldMarks: user.fieldMark, // Mongo matches this against every element of the array field automatically
    status: 'Published',
  })
    .sort({ createdAt: -1 })
    .lean()

  return { user, matchedContent }
}

/**
 * Aggregation version: does the same lookup in a single round trip to the
 * database using $lookup with a sub-pipeline (needed because the join
 * condition is "value is a member of an array", not a plain equality —
 * a plain $lookup can only equi-join on matching scalar fields).
 *
 * Prefer this when fetching many users at once (e.g. an admin report of
 * "each student + their matched content") to avoid N+1 queries.
 *
 * @param {string} userId
 * @returns {Promise<object | null>}
 */
export async function getUserWithMatchedContentAggregated(userId) {
  const [result] = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: CuratedContent.collection.name,
        let: { userField: '$fieldMark' },
        pipeline: [
          { $match: { $expr: { $in: ['$$userField', '$fieldMarks'] } } },
          { $match: { status: 'Published' } },
          { $sort: { createdAt: -1 } },
        ],
        as: 'matchedContent',
      },
    },
  ])

  return result ?? null
}

/**
 * Reverse lookup — given a fieldMark, list everyone in it. Useful for the
 * admin console (e.g. "how many Computer Science students are there").
 * Backed by the `fieldMark` index on User.
 *
 * @param {string} fieldMark
 */
export async function getUsersByFieldMark(fieldMark) {
  return User.find({ fieldMark }).lean()
}
