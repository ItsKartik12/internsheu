import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import Problem from '../models/Problem.js'

const SEED_PROBLEMS = [
  {
    title: 'Two Sum',
    slug: 'two-sum',
    topic: 'Arrays & Hashing',
    difficulty: 'Easy',
    description:
      'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    tags: ['Array', 'Hash Table'],
    externalProvider: 'vjudge',
    externalProblemId: 'LeetCode-1',
    externalUrl: 'https://vjudge.net/problem/LeetCode-1',
    supportedLanguages: ['C++', 'Java', 'Python', 'JavaScript'],
    sampleCases: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
    ],
    status: 'active',
  },
  {
    title: 'Binary Search',
    slug: 'binary-search',
    topic: 'Binary Search',
    difficulty: 'Easy',
    description:
      'Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return -1.\n\nYou must write an algorithm with `O(log n)` runtime complexity.',
    tags: ['Array', 'Binary Search'],
    externalProvider: 'vjudge',
    externalProblemId: 'LeetCode-704',
    externalUrl: 'https://vjudge.net/problem/LeetCode-704',
    supportedLanguages: ['C++', 'Java', 'Python', 'JavaScript'],
    sampleCases: [
      {
        input: 'nums = [-1,0,3,5,9,12], target = 9',
        output: '4',
        explanation: '9 exists in nums and its index is 4.',
      },
      {
        input: 'nums = [-1,0,3,5,9,12], target = 2',
        output: '-1',
        explanation: '2 does not exist in nums so return -1.',
      },
    ],
    status: 'active',
  },
  {
    title: 'Merge Intervals',
    slug: 'merge-intervals',
    topic: 'Intervals & Sorting',
    difficulty: 'Medium',
    description:
      'Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
    tags: ['Array', 'Sorting'],
    externalProvider: 'vjudge',
    externalProblemId: 'LeetCode-56',
    externalUrl: 'https://vjudge.net/problem/LeetCode-56',
    supportedLanguages: ['C++', 'Java', 'Python', 'JavaScript'],
    sampleCases: [
      {
        input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
        output: '[[1,6],[8,10],[15,18]]',
        explanation: 'Since intervals [1,3] and [2,6] overlap, merge them into [1,6].',
      },
      {
        input: 'intervals = [[1,4],[4,5]]',
        output: '[[1,5]]',
        explanation: 'Intervals [1,4] and [4,5] are considered overlapping.',
      },
    ],
    status: 'active',
  },
  {
    title: 'Catch That Cow (BFS Graph)',
    slug: 'catch-that-cow-bfs-graph',
    topic: 'Graphs & BFS',
    difficulty: 'Medium',
    description:
      'Farmer John has been informed of the location of a runaway cow and wants to catch her immediately. He starts at a coordinate `N` (0 <= N <= 100,000) and the cow is at a coordinate `K` (0 <= K <= 100,000) on the same number line.\n\nFarmer John has two modes of transportation: walking and teleporting.\n* Walking: He can move from any point `X` to `X - 1` or `X + 1` in a single minute.\n* Teleporting: He can move from any point `X` to `2 * X` in a single minute.\n\nDetermine the minimum time in minutes required for Farmer John to catch the runaway cow using Breadth-First Search (BFS).',
    tags: ['Breadth-First Search', 'Graph'],
    externalProvider: 'vjudge',
    externalProblemId: 'POJ-3278',
    externalUrl: 'https://vjudge.net/problem/POJ-3278',
    supportedLanguages: ['C++', 'Java', 'Python', 'JavaScript'],
    sampleCases: [
      {
        input: 'N = 5, K = 17',
        output: '4',
        explanation: 'The fastest way is 5 -> 4 -> 8 -> 16 -> 17, which takes 4 minutes.',
      },
    ],
    status: 'active',
  },
  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    topic: 'Stacks',
    difficulty: 'Easy',
    description:
      'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
    tags: ['String', 'Stack'],
    externalProvider: 'vjudge',
    externalProblemId: 'LeetCode-20',
    externalUrl: 'https://vjudge.net/problem/LeetCode-20',
    supportedLanguages: ['C++', 'Java', 'Python', 'JavaScript'],
    sampleCases: [
      {
        input: 's = "()"',
        output: 'true',
        explanation: 'A pair of matched round brackets.',
      },
      {
        input: 's = "()[]{}"',
        output: 'true',
        explanation: 'All brackets closed in matched order.',
      },
      {
        input: 's = "(]"',
        output: 'false',
        explanation: 'Mismatched brackets.',
      },
    ],
    status: 'active',
  },
  {
    title: 'Shortest Path (Dijkstra Graph)',
    slug: 'shortest-path-dijkstra',
    topic: 'Graphs & BFS',
    difficulty: 'Hard',
    description:
      'Given a weighted undirected graph with `n` vertices and `m` edges, find the shortest path between vertex 1 and vertex `n`. If there are several shortest paths, output any of them. If no path exists, output -1.',
    tags: ['Shortest Paths', 'Dijkstra', 'Graph'],
    externalProvider: 'vjudge',
    externalProblemId: 'CodeForces-20C',
    externalUrl: 'https://vjudge.net/problem/CodeForces-20C',
    supportedLanguages: ['C++', 'Java', 'Python', 'JavaScript'],
    sampleCases: [
      {
        input: '5 vertices, 6 edges\n1 2 2\n2 5 5\n2 3 4\n1 4 1\n4 3 3\n3 5 1',
        output: '1 4 3 5',
        explanation: 'Path 1 -> 4 -> 3 -> 5 has total weight 1 + 3 + 1 = 5.',
      },
    ],
    status: 'active',
  },
]

async function runSeed() {
  try {
    await connectDB()
    console.log('[seed] Connected to MongoDB Atlas.')

    for (const prob of SEED_PROBLEMS) {
      await Problem.findOneAndUpdate({ slug: prob.slug }, prob, {
        upsert: true,
        new: true,
      })
      console.log(`[seed] Problem upserted: ${prob.title} (${prob.externalProblemId})`)
    }

    console.log('[seed] Problem Library seeded successfully.')
    process.exit(0)
  } catch (err) {
    console.error('[seed] Error seeding problems:', err)
    process.exit(1)
  }
}

runSeed()
