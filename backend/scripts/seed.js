import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Course from '../models/Course.js'
import Internship from '../models/Internship.js'
import Job from '../models/Job.js'
import AssessmentTopic from '../models/AssessmentTopic.js'
import AssessmentQuestion from '../models/AssessmentQuestion.js'

const DEMO_PASSWORD = 'password123'

const TOPICS_DATA = [
  {
    name: 'JavaScript Fundamentals',
    slug: 'javascript-fundamentals',
    category: 'Web Development',
    description: 'Core concepts including scope, closures, promises, async/await, and modern ES6+ syntax.',
    icon: 'Code',
    timeLimitMinutes: 15,
    passPercentage: 60,
    questions: [
      {
        question: 'What will be the output of `console.log(typeof NaN)`?',
        options: ['number', 'NaN', 'undefined', 'object'],
        correctAnswer: 0,
        explanation: 'In JavaScript, NaN stands for "Not-a-Number", but its data type is actually number.',
        difficulty: 'Easy',
        marks: 1,
      },
      {
        question: 'Which method creates a new array with all elements that pass the test implemented by the provided function?',
        options: ['map()', 'filter()', 'reduce()', 'forEach()'],
        correctAnswer: 1,
        explanation: 'The filter() method creates a shallow copy of a portion of a given array, filtered down to just the elements that pass the test.',
        difficulty: 'Easy',
        marks: 1,
      },
      {
        question: 'What is the purpose of the `Promise.all()` method in JavaScript?',
        options: [
          'Resolves when the first promise resolves',
          'Waits for all promises to resolve or for any to reject',
          'Runs promises sequentially one after another',
          'Cancels all pending promises',
        ],
        correctAnswer: 1,
        explanation: 'Promise.all() takes an iterable of promises and returns a single Promise that fulfills when all of the promises fulfill, or rejects when any promise rejects.',
        difficulty: 'Medium',
        marks: 2,
      },
      {
        question: 'What is a closure in JavaScript?',
        options: [
          'A method that terminates an execution context',
          'A function bundled together with references to its surrounding state (lexical environment)',
          'A way to close browser windows programmatically',
          'A private variable syntax introduced in ES2022',
        ],
        correctAnswer: 1,
        explanation: 'A closure gives a function access to its outer scope from an inner function even after the outer function has closed.',
        difficulty: 'Medium',
        marks: 2,
      },
      {
        question: 'Which of the following creates an immutable binding in JavaScript?',
        options: ['var', 'let', 'const', 'Object.seal()'],
        correctAnswer: 2,
        explanation: '`const` declarations create read-only references to a value. The variable identifier cannot be reassigned.',
        difficulty: 'Easy',
        marks: 1,
      },
      {
        question: 'What does the Event Loop in JavaScript primarily do?',
        options: [
          'Executes multiple threads simultaneously in the V8 engine',
          'Monitors the Call Stack and Task Queue, pushing callback functions to the stack when empty',
          'Compiles JavaScript code to machine instructions',
          'Manages memory garbage collection for DOM elements',
        ],
        correctAnswer: 1,
        explanation: 'The Event Loop checks if the call stack is empty, and if so, moves the first task from the task/microtask queue to the call stack.',
        difficulty: 'Hard',
        marks: 3,
      },
    ],
  },
  {
    name: 'React Architecture',
    slug: 'react-architecture',
    category: 'Web Development',
    description: 'Hooks, virtual DOM, component lifecycles, and modern state management patterns.',
    icon: 'Layers',
    timeLimitMinutes: 15,
    passPercentage: 60,
    questions: [
      {
        question: 'When does the cleanup function in `useEffect` run?',
        options: [
          'Only when the component mounts',
          'Before the component unmounts and before re-running the effect on dependency change',
          'After every single render regardless of dependencies',
          'Only when an error occurs during rendering',
        ],
        correctAnswer: 1,
        explanation: 'React performs the cleanup when the component unmounts and also before running the effect next time if dependencies change.',
        difficulty: 'Medium',
        marks: 2,
      },
      {
        question: 'What is the main benefit of using `useCallback` in React?',
        options: [
          'Caches the return value of an expensive calculation',
          'Prevents child components that use React.memo from re-rendering by memoizing the function reference',
          'Automatically dispatches Redux actions',
          'Replaces traditional event listeners in the DOM',
        ],
        correctAnswer: 1,
        explanation: 'useCallback caches a function definition between renders so child components receiving it as a prop don\'t needlessly re-render.',
        difficulty: 'Medium',
        marks: 2,
      },
      {
        question: 'Why should keys be unique among siblings in React lists?',
        options: [
          'To satisfy HTML5 validation rules',
          'To help React identify which items have changed, been added, or been removed during reconciliation',
          'To allow CSS selectors to target list items by ID',
          'To enable automatic sorting of list items',
        ],
        correctAnswer: 1,
        explanation: 'React uses keys to match children in the original tree with children in the subsequent tree to optimize rendering.',
        difficulty: 'Easy',
        marks: 1,
      },
      {
        question: 'Which hook should be used to access a mutable ref object whose `.current` property does NOT trigger a re-render when changed?',
        options: ['useState', 'useMemo', 'useRef', 'useReducer'],
        correctAnswer: 2,
        explanation: '`useRef` returns a mutable ref object whose .current property can hold any value and changing it does not cause a re-render.',
        difficulty: 'Easy',
        marks: 1,
      },
      {
        question: 'What is React Reconciliation?',
        options: [
          'The algorithm React uses to diff one tree with another to determine which parts need to be changed in the actual DOM',
          'The process of synchronizing local state with a remote backend database',
          'The compilation step performed by Babel or SWC',
          'The way React handles CSS module name collisions',
        ],
        correctAnswer: 0,
        explanation: 'Reconciliation is the "diffing" algorithm React uses to generate the minimum set of DOM updates needed when state changes.',
        difficulty: 'Hard',
        marks: 3,
      },
    ],
  },
  {
    name: 'Node.js & Express',
    slug: 'nodejs-express',
    category: 'Backend Development',
    description: 'Server runtime, Express middleware, asynchronous I/O, and RESTful API design.',
    icon: 'Server',
    timeLimitMinutes: 15,
    passPercentage: 60,
    questions: [
      {
        question: 'In Express, what are the four arguments expected by error-handling middleware?',
        options: [
          '(req, res, next, config)',
          '(err, req, res, next)',
          '(error, request, response, errorCallback)',
          '(status, message, req, res)',
        ],
        correctAnswer: 1,
        explanation: 'Error-handling middleware functions have four arguments instead of three: (err, req, res, next).',
        difficulty: 'Easy',
        marks: 1,
      },
      {
        question: 'What is the purpose of the `process.nextTick()` method in Node.js?',
        options: [
          'Defers execution until the next iteration of the event loop after I/O callbacks',
          'Schedules a callback to be invoked immediately before the next phase of the event loop begins',
          'Pauses the Node process for a specified number of clock cycles',
          'Creates a background worker thread',
        ],
        correctAnswer: 1,
        explanation: 'process.nextTick() adds callback functions to the "next tick queue" which is processed before moving to the next event loop phase.',
        difficulty: 'Hard',
        marks: 3,
      },
      {
        question: 'Which header does CORS middleware primarily use to tell browsers which domains can access resources?',
        options: [
          'Access-Control-Allow-Origin',
          'Authorization',
          'Content-Security-Policy',
          'X-Frame-Options',
        ],
        correctAnswer: 0,
        explanation: 'Access-Control-Allow-Origin specifies which origin can access the resource.',
        difficulty: 'Easy',
        marks: 1,
      },
      {
        question: 'Which core module in Node.js provides streaming and file system operations?',
        options: ['http', 'fs', 'path', 'crypto'],
        correctAnswer: 1,
        explanation: 'The `fs` (File System) module allows working with the file system on your computer.',
        difficulty: 'Easy',
        marks: 1,
      },
    ],
  },
  {
    name: 'Data Structures & Algorithms',
    slug: 'dsa',
    category: 'Core CS',
    description: 'Arrays, linked lists, trees, graphs, sorting, searching, and Big-O time complexity.',
    icon: 'Cpu',
    timeLimitMinutes: 20,
    passPercentage: 60,
    questions: [
      {
        question: 'What is the worst-case time complexity of QuickSort?',
        options: ['O(n log n)', 'O(n^2)', 'O(n)', 'O(log n)'],
        correctAnswer: 1,
        explanation: 'QuickSort worst case is O(n^2), typically occurring when the pivot is the smallest or largest element each time (e.g. already sorted array with naive pivot selection).',
        difficulty: 'Medium',
        marks: 2,
      },
      {
        question: 'Which data structure is typically used to implement Breadth-First Search (BFS) in graphs?',
        options: ['Stack', 'Queue', 'Heap', 'Trie'],
        correctAnswer: 1,
        explanation: 'BFS uses a Queue (FIFO) to explore neighboring nodes level by level.',
        difficulty: 'Easy',
        marks: 1,
      },
      {
        question: 'What is the time complexity of searching for an element in a balanced Binary Search Tree (BST)?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctAnswer: 1,
        explanation: 'In a balanced BST (like AVL or Red-Black tree), the height is log2(n), yielding O(log n) search time.',
        difficulty: 'Medium',
        marks: 2,
      },
      {
        question: 'What is an anagram of a string?',
        options: [
          'A string read the same backwards and forwards',
          'A word formed by rearranging the letters of another word',
          'A substring of length n/2',
          'A compressed hash value of a string',
        ],
        correctAnswer: 1,
        explanation: 'An anagram is a word or phrase formed by rearranging the letters of a different word or phrase.',
        difficulty: 'Easy',
        marks: 1,
      },
    ],
  },
  {
    name: 'Database Management & MongoDB',
    slug: 'dbms-mongodb',
    category: 'Databases',
    description: 'Relational vs NoSQL design, indexing, ACID properties, aggregation, and Mongoose modeling.',
    icon: 'Database',
    timeLimitMinutes: 15,
    passPercentage: 60,
    questions: [
      {
        question: 'In MongoDB, what is an aggregation pipeline stage used to group documents by a specified identifier?',
        options: ['$match', '$project', '$group', '$lookup'],
        correctAnswer: 2,
        explanation: 'The $group stage separates documents into groups according to a "group key" and outputs one document for each unique key.',
        difficulty: 'Medium',
        marks: 2,
      },
      {
        question: 'What does ACID stand for in database transaction management?',
        options: [
          'Accuracy, Consistency, Integrity, Durability',
          'Atomicity, Consistency, Isolation, Durability',
          'Availability, Concurrency, Indexing, Distribution',
          'Authentication, Clustering, Ingestion, Decoding',
        ],
        correctAnswer: 1,
        explanation: 'ACID stands for Atomicity, Consistency, Isolation, and Durability.',
        difficulty: 'Easy',
        marks: 1,
      },
      {
        question: 'What is the primary purpose of creating an index on a MongoDB collection field?',
        options: [
          'To encrypt sensitive document fields',
          'To speed up query search performance by avoiding full collection scans',
          'To automatically replicate data across shards',
          'To compress the BSON storage format',
        ],
        correctAnswer: 1,
        explanation: 'Indexes support the efficient execution of queries in MongoDB by storing a small portion of the collection\'s data set in an easy-to-traverse form.',
        difficulty: 'Easy',
        marks: 1,
      },
    ],
  },
  {
    name: 'Python Programming',
    slug: 'python-programming',
    category: 'Programming',
    description: 'Python syntax, data structures, list comprehensions, decorators, and OOP concepts.',
    icon: 'Terminal',
    timeLimitMinutes: 15,
    passPercentage: 60,
    questions: [
      {
        question: 'What will `[x**2 for x in range(5) if x % 2 == 0]` evaluate to?',
        options: ['[0, 4, 16]', '[1, 9]', '[0, 1, 4, 9, 16]', '[4, 16]'],
        correctAnswer: 0,
        explanation: 'For range(5) (0, 1, 2, 3, 4), the even numbers are 0, 2, and 4. Their squares are 0, 4, and 16.',
        difficulty: 'Easy',
        marks: 1,
      },
      {
        question: 'In Python, what is a decorator?',
        options: [
          'A design pattern for styling CLI terminal outputs',
          'A callable that takes a function as an argument and extends its behavior without modifying it',
          'A keyword used to declare class attributes',
          'A method to serialize objects into JSON format',
        ],
        correctAnswer: 1,
        explanation: 'A decorator in Python is any callable Python object that is used to modify or extend a function or method definition.',
        difficulty: 'Medium',
        marks: 2,
      },
      {
        question: 'What is the difference between a list and a tuple in Python?',
        options: [
          'Lists are immutable, tuples are mutable',
          'Lists are mutable, tuples are immutable',
          'Lists cannot contain mixed types, tuples can',
          'Tuples can only store numbers',
        ],
        correctAnswer: 1,
        explanation: 'Lists are mutable (can be altered after creation), whereas tuples are immutable.',
        difficulty: 'Easy',
        marks: 1,
      },
    ],
  },
]

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI environment variable is required to run seed script.')
    process.exit(1)
  }

  console.log('Connecting to MongoDB (database: internsetu)...')
  await mongoose.connect(uri)
  console.log('Connected successfully.')

  // 1. Create or update Demo Users
  console.log('\n--- Seeding Users ---')
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)

  const usersData = [
    {
      name: 'Aarav Sharma',
      email: 'student@internsheu.edu',
      passwordHash,
      role: 'student',
      enrollmentNo: '2024CS001',
      fieldMark: 'Computer Science',
      isActive: true,
    },
    {
      name: 'Prof. Sarah Jenkins',
      email: 'educator@internsheu.edu',
      passwordHash,
      role: 'educator',
      isActive: true,
    },
    {
      name: 'Nexus Tech Talent Team',
      email: 'industry@internsheu.edu',
      passwordHash,
      role: 'industry',
      isActive: true,
    },
    {
      name: 'Portal Administrator',
      email: 'admin@internsheu.edu',
      passwordHash,
      role: 'admin',
      isActive: true,
    },
  ]

  const createdUsers = {}
  for (const u of usersData) {
    let user = await User.findOne({ email: u.email })
    if (user) {
      user.name = u.name
      user.passwordHash = u.passwordHash
      user.role = u.role
      if (u.enrollmentNo) user.enrollmentNo = u.enrollmentNo
      if (u.fieldMark) user.fieldMark = u.fieldMark
      user.isActive = true
      await user.save()
      console.log(`Updated existing user: ${u.email} (${u.role})`)
    } else {
      user = await User.create(u)
      console.log(`Created new user: ${u.email} (${u.role})`)
    }
    createdUsers[u.role] = user
  }

  // 2. Seed Courses (educator)
  console.log('\n--- Seeding Courses ---')
  const educator = createdUsers.educator
  const coursesData = [
    {
      title: 'Full Stack MERN Architecture',
      description: 'Master production-grade React, Node.js, Express, and MongoDB with modern authentication and clean architecture.',
      category: 'Web Development',
      level: 'Intermediate',
      duration: '8 Weeks',
      educatorId: educator._id,
      educatorName: educator.name,
      tags: ['React', 'Node.js', 'MongoDB', 'Express', 'JWT'],
      lessons: [
        { title: 'Modern React Component Patterns', duration: '45 mins' },
        { title: 'RESTful API Design & Express Middlewares', duration: '60 mins' },
        { title: 'MongoDB Schema Optimization & Indexing', duration: '50 mins' },
        { title: 'JWT Authentication & Role-Based Access Control', duration: '55 mins' },
      ],
      enrolledCount: 124,
      rating: 4.9,
    },
    {
      title: 'Applied Machine Learning with Python',
      description: 'Hands-on practical machine learning covering regression, classification, clustering, and neural network foundations.',
      category: 'AI & Data Science',
      level: 'Beginner',
      duration: '6 Weeks',
      educatorId: educator._id,
      educatorName: educator.name,
      tags: ['Python', 'Scikit-Learn', 'Pandas', 'NumPy', 'Data Science'],
      lessons: [
        { title: 'Data Cleaning & Exploratory Analysis', duration: '40 mins' },
        { title: 'Supervised Learning: Regressors & Classifiers', duration: '65 mins' },
        { title: 'Unsupervised Learning & Dimensionality Reduction', duration: '45 mins' },
        { title: 'Model Evaluation Metrics & Cross Validation', duration: '50 mins' },
      ],
      enrolledCount: 88,
      rating: 4.8,
    },
    {
      title: 'Cloud Native & DevOps Fundamentals',
      description: 'Learn Docker containerization, CI/CD pipelines, and cloud deployment principles for modern applications.',
      category: 'Cloud & DevOps',
      level: 'Intermediate',
      duration: '5 Weeks',
      educatorId: educator._id,
      educatorName: educator.name,
      tags: ['Docker', 'CI/CD', 'AWS', 'DevOps', 'Kubernetes'],
      lessons: [
        { title: 'Docker Containers & Multi-stage Builds', duration: '50 mins' },
        { title: 'Continuous Integration with GitHub Actions', duration: '45 mins' },
        { title: 'Cloud Infrastructure & Deployments', duration: '60 mins' },
      ],
      enrolledCount: 65,
      rating: 4.7,
    },
  ]

  for (const c of coursesData) {
    await Course.findOneAndUpdate(
      { title: c.title, educatorId: c.educatorId },
      c,
      { upsert: true, new: true }
    )
    console.log(`Seeded course: ${c.title}`)
  }

  // 3. Seed Internships (industry)
  console.log('\n--- Seeding Internships ---')
  const industry = createdUsers.industry
  const internshipsData = [
    {
      title: 'Frontend Developer Intern (React/TypeScript)',
      company: 'Nexus Innovations',
      industryId: industry._id,
      description: 'Build responsive, accessible user interfaces using React 18, TypeScript, and modern styling libraries.',
      skills: ['React', 'TypeScript', 'TailwindCSS', 'REST APIs'],
      location: 'Remote',
      type: 'Remote',
      stipend: '₹20,000 / month',
      duration: '3 Months',
      openings: 3,
      applicantsCount: 14,
    },
    {
      title: 'Backend Engineering Intern (Node.js/Express)',
      company: 'Nexus Innovations',
      industryId: industry._id,
      description: 'Design and optimize backend APIs, integrate MongoDB queries, and implement real-time event streaming.',
      skills: ['Node.js', 'Express', 'MongoDB', 'REST APIs'],
      location: 'Bengaluru / Hybrid',
      type: 'Hybrid',
      stipend: '₹25,000 / month',
      duration: '6 Months',
      openings: 2,
      applicantsCount: 19,
    },
    {
      title: 'Data Science & AI Intern',
      company: 'Cortex Analytics',
      industryId: industry._id,
      description: 'Assist in data preprocessing, feature engineering, and model training using PyTorch and Scikit-Learn.',
      skills: ['Python', 'Pandas', 'Machine Learning', 'Data Analysis'],
      location: 'Remote',
      type: 'Remote',
      stipend: '₹22,000 / month',
      duration: '4 Months',
      openings: 2,
      applicantsCount: 23,
    },
  ]

  for (const item of internshipsData) {
    await Internship.findOneAndUpdate(
      { title: item.title, company: item.company },
      item,
      { upsert: true, new: true }
    )
    console.log(`Seeded internship: ${item.title}`)
  }

  // 4. Seed Jobs (industry)
  console.log('\n--- Seeding Jobs ---')
  const jobsData = [
    {
      title: 'Junior Full Stack Engineer',
      company: 'Nexus Innovations',
      industryId: industry._id,
      description: 'Join our core engineering team to build scalable collaboration features across web and mobile platforms.',
      skills: ['React', 'Node.js', 'MongoDB', 'Docker', 'Git'],
      location: 'Bengaluru / Remote',
      type: 'Full-time',
      experienceLevel: 'Entry Level',
      salary: '₹7 - 10 LPA',
      openings: 2,
      applicantsCount: 42,
    },
    {
      title: 'Associate Cloud DevOps Engineer',
      company: 'Skyline Cloud Systems',
      industryId: industry._id,
      description: 'Maintain cloud infrastructure, automate deployment pipelines, and optimize container clusters.',
      skills: ['Docker', 'AWS', 'Linux', 'CI/CD', 'Python'],
      location: 'Hyderabad / Hybrid',
      type: 'Full-time',
      experienceLevel: 'Entry Level',
      salary: '₹8 - 12 LPA',
      openings: 1,
      applicantsCount: 29,
    },
  ]

  for (const j of jobsData) {
    await Job.findOneAndUpdate(
      { title: j.title, company: j.company },
      j,
      { upsert: true, new: true }
    )
    console.log(`Seeded job: ${j.title}`)
  }

  // 5. Seed Assessment Topics & Questions
  console.log('\n--- Seeding Assessment Topics & Questions ---')
  for (const topicData of TOPICS_DATA) {
    const { questions, ...topicFields } = topicData
    topicFields.questionCount = questions.length

    const topic = await AssessmentTopic.findOneAndUpdate(
      { slug: topicFields.slug },
      topicFields,
      { upsert: true, new: true }
    )
    console.log(`Seeded topic: ${topic.name} (${questions.length} questions)`)

    // Clear existing questions for this topic to avoid duplicates
    await AssessmentQuestion.deleteMany({ topicId: topic._id })

    for (const q of questions) {
      await AssessmentQuestion.create({
        ...q,
        topicId: topic._id,
      })
    }
  }

  console.log('\n=============================================')
  console.log('Seed completed successfully!')
  console.log('Demo Accounts:')
  console.log('  Student:  student@internsheu.edu   / password123')
  console.log('  Educator: educator@internsheu.edu  / password123')
  console.log('  Industry: industry@internsheu.edu  / password123')
  console.log('  Admin:    admin@internsheu.edu     / password123')
  console.log('=============================================\n')

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
