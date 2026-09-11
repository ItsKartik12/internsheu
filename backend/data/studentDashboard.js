// ────────────────────────────────────────────────────────────────────────
// Mock data layer — mirrors the shape the frontend's mockDatabase.js
// already expects. Swap the two exports below for real queries (e.g. via
// `pg` against DATABASE_URL) once the database is wired up; the route
// handler in routes/student.js doesn't need to change shape-wise.
// ────────────────────────────────────────────────────────────────────────

export const studentProfile = {
  id: 'STU-001',
  name: 'Vishal Chauhan',
  enrollmentNo: '08520803124',
  email: 'vishal.chauhan@bpit.ac.in',
  institute: 'Bhagwan Parshuram Institute of Technology',
  branch: 'Computer Science & Engineering',
  semester: 7,
  cgpa: 8.4,
  targetRole: 'Cloud & Full-Stack Engineer — Intern Track',
  skills: [
    { id: 'SK-01', name: 'C++', category: 'Programming Language', proficiency: 82 },
    { id: 'SK-02', name: 'JavaScript (ES6)', category: 'Programming Language', proficiency: 75 },
    { id: 'SK-03', name: 'Database Modeling', category: 'Data', proficiency: 68 },
    { id: 'SK-04', name: 'Data Structures & Algorithms', category: 'Core CS', proficiency: 55 },
  ],
}

export const matchedOpportunities = [
  {
    id: 'OPP-101',
    title: 'Backend Engineering Intern',
    company: 'Bharat FinTech Works',
    location: 'Gurugram, HR (Hybrid)',
    stipend: '₹35,000/mo',
    matchScore: 78,
  },
  {
    id: 'OPP-104',
    title: 'Software Development Intern',
    company: 'Orbit Mobility',
    location: 'Noida, UP (On-site)',
    stipend: '₹25,000/mo',
    matchScore: 71,
  },
  {
    id: 'OPP-102',
    title: 'Data Systems Intern',
    company: 'Nexora Analytics',
    location: 'Remote',
    stipend: '₹28,000/mo',
    matchScore: 54,
  },
]
