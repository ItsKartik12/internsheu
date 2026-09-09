// ────────────────────────────────────────────────────────────────────────
// internsheu — mock relational data layer
// Modeled as normalized tables + join tables, the way it would sit in a
// real schema (students, skills, student_skills, industry_requirements,
// companies, opportunities, opportunity_requirements). Selector functions
// at the bottom emulate the joins/queries a real API would perform.
// ────────────────────────────────────────────────────────────────────────

// ---- students ----
export const students = [
  {
    id: 'STU-001',
    name: 'Vishal Chauhan',
    enrollmentNo: '08520803124',
    email: 'vishal.chauhan@bpit.ac.in',
    institute: 'Bhagwan Parshuram Institute of Technology',
    branch: 'Computer Science & Engineering',
    semester: 7,
    cgpa: 8.4,
    targetRole: 'ROLE-003',
    avatarInitials: 'VC',
  },
]

// ---- skills (master catalog) ----
export const skills = [
  { id: 'SK-01', name: 'C++', category: 'Programming Language' },
  { id: 'SK-02', name: 'JavaScript (ES6)', category: 'Programming Language' },
  { id: 'SK-03', name: 'Database Modeling', category: 'Data' },
  { id: 'SK-04', name: 'Data Structures & Algorithms', category: 'Core CS' },
  { id: 'SK-05', name: 'Cloud Architecture (AWS/Azure)', category: 'Cloud & DevOps' },
  { id: 'SK-06', name: 'System Design', category: 'Core CS' },
  { id: 'SK-07', name: 'Containers & CI/CD', category: 'Cloud & DevOps' },
  { id: 'SK-08', name: 'React.js', category: 'Frontend' },
  { id: 'SK-09', name: 'REST API Design', category: 'Backend' },
  { id: 'SK-10', name: 'Python', category: 'Programming Language' },
]

// ---- student_skills (join table: proficiency 0-100) ----
export const studentSkills = [
  { studentId: 'STU-001', skillId: 'SK-01', proficiency: 82 },
  { studentId: 'STU-001', skillId: 'SK-02', proficiency: 75 },
  { studentId: 'STU-001', skillId: 'SK-03', proficiency: 68 },
  { studentId: 'STU-001', skillId: 'SK-04', proficiency: 55 },
  { studentId: 'STU-001', skillId: 'SK-09', proficiency: 40 },
]

// ---- industry_roles (benchmark requirement sets, sourced from partner intake forms) ----
export const industryRoles = [
  { id: 'ROLE-003', title: 'Cloud & Full-Stack Engineer — Intern Track' },
]

// ---- role_requirements (join: role -> skill -> minimum proficiency expected) ----
export const roleRequirements = [
  { roleId: 'ROLE-003', skillId: 'SK-01', minProficiency: 70 },
  { roleId: 'ROLE-003', skillId: 'SK-02', minProficiency: 85 },
  { roleId: 'ROLE-003', skillId: 'SK-03', minProficiency: 80 },
  { roleId: 'ROLE-003', skillId: 'SK-04', minProficiency: 80 },
  { roleId: 'ROLE-003', skillId: 'SK-05', minProficiency: 75 },
  { roleId: 'ROLE-003', skillId: 'SK-06', minProficiency: 70 },
  { roleId: 'ROLE-003', skillId: 'SK-07', minProficiency: 65 },
]

// ---- companies ----
export const companies = [
  { id: 'CMP-01', name: 'Zenith Cloud Labs', logoInitials: 'ZC', sector: 'Cloud Infrastructure' },
  { id: 'CMP-02', name: 'Nexora Analytics', logoInitials: 'NA', sector: 'Data & Analytics' },
  { id: 'CMP-03', name: 'Kavach Systems', logoInitials: 'KS', sector: 'Cybersecurity' },
  { id: 'CMP-04', name: 'Bharat FinTech Works', logoInitials: 'BF', sector: 'FinTech' },
  { id: 'CMP-05', name: 'Orbit Mobility', logoInitials: 'OM', sector: 'IoT & Embedded' },
]

// ---- opportunities ----
export const opportunities = [
  {
    id: 'OPP-101',
    companyId: 'CMP-04',
    title: 'Backend Engineering Intern',
    location: 'Gurugram, HR (Hybrid)',
    stipend: '₹35,000/mo',
    duration: '6 months',
    postedDate: '2026-08-28',
    requiredSkillIds: ['SK-01', 'SK-03', 'SK-04'],
  },
  {
    id: 'OPP-102',
    companyId: 'CMP-02',
    title: 'Data Systems Intern',
    location: 'Remote',
    stipend: '₹28,000/mo',
    duration: '4 months',
    postedDate: '2026-09-02',
    requiredSkillIds: ['SK-02', 'SK-03', 'SK-09'],
  },
  {
    id: 'OPP-103',
    companyId: 'CMP-01',
    title: 'Cloud Infrastructure Intern',
    location: 'Bengaluru, KA (On-site)',
    stipend: '₹40,000/mo',
    duration: '6 months',
    postedDate: '2026-08-15',
    requiredSkillIds: ['SK-05', 'SK-07', 'SK-06'],
  },
  {
    id: 'OPP-104',
    companyId: 'CMP-05',
    title: 'Software Development Intern',
    location: 'Noida, UP (On-site)',
    stipend: '₹25,000/mo',
    duration: '3 months',
    postedDate: '2026-09-05',
    requiredSkillIds: ['SK-01', 'SK-04', 'SK-02'],
  },
  {
    id: 'OPP-105',
    companyId: 'CMP-03',
    title: 'Security Research Intern',
    location: 'Pune, MH (Hybrid)',
    stipend: '₹30,000/mo',
    duration: '5 months',
    postedDate: '2026-08-20',
    requiredSkillIds: ['SK-06', 'SK-04', 'SK-05'],
  },
]

// ────────────────────────────────────────────────────────────────────────
// Selectors — emulate what an API layer would return after joining tables
// ────────────────────────────────────────────────────────────────────────

export function getStudentById(studentId) {
  return students.find((s) => s.id === studentId) ?? null
}

export function getStudentSkillProfile(studentId) {
  return studentSkills
    .filter((row) => row.studentId === studentId)
    .map((row) => {
      const skill = skills.find((s) => s.id === row.skillId)
      return { ...skill, proficiency: row.proficiency }
    })
}

export function getRoleRequirementProfile(roleId) {
  return roleRequirements
    .filter((row) => row.roleId === roleId)
    .map((row) => {
      const skill = skills.find((s) => s.id === row.skillId)
      return { ...skill, minProficiency: row.minProficiency }
    })
}

// Merges a student's proficiency against a target role's requirement set,
// producing the gap analysis dataset (positive gap = shortfall).
export function getSkillGapAnalysis(studentId, roleId) {
  const requirementProfile = getRoleRequirementProfile(roleId)
  const studentProfile = getStudentSkillProfile(studentId)

  return requirementProfile.map((req) => {
    const owned = studentProfile.find((s) => s.id === req.id)
    const current = owned ? owned.proficiency : 0
    const gap = Math.max(0, req.minProficiency - current)
    return {
      skillId: req.id,
      name: req.name,
      category: req.category,
      current,
      required: req.minProficiency,
      gap,
      status: gap === 0 ? 'met' : gap <= 15 ? 'near' : 'gap',
    }
  })
}

// Algorithmic match score: overlap between a student's known skills and an
// opportunity's required skills, weighted by the student's proficiency.
export function getMatchedOpportunities(studentId) {
  const studentProfile = getStudentSkillProfile(studentId)
  const ownedSkillIds = new Set(studentProfile.map((s) => s.id))

  return opportunities
    .map((opp) => {
      const company = companies.find((c) => c.id === opp.companyId)
      const matchedSkills = opp.requiredSkillIds.filter((id) => ownedSkillIds.has(id))
      const missingSkills = opp.requiredSkillIds
        .filter((id) => !ownedSkillIds.has(id))
        .map((id) => skills.find((s) => s.id === id))

      const proficiencySum = matchedSkills.reduce((sum, id) => {
        const owned = studentProfile.find((s) => s.id === id)
        return sum + (owned ? owned.proficiency : 0)
      }, 0)
      const maxPossible = opp.requiredSkillIds.length * 100
      const matchScore = maxPossible === 0 ? 0 : Math.round((proficiencySum / maxPossible) * 100)

      return {
        ...opp,
        company,
        matchScore,
        matchedCount: matchedSkills.length,
        totalRequired: opp.requiredSkillIds.length,
        missingSkills,
        requiredSkills: opp.requiredSkillIds.map((id) => skills.find((s) => s.id === id)),
      }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
}
