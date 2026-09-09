# internsheu — Academia-Industry Collaboration Portal

A Smart India Hackathon prototype: a premium, enterprise-grade student
portal that surfaces skill gaps against real industry benchmarks and
algorithmically matches students to internship opportunities.

## Stack

- React 18 + Vite
- Tailwind CSS
- React Router
- Lucide React icons

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (defaults to `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  components/
    Sidebar.jsx            Persistent left navigation
    Header.jsx              Top bar — breadcrumbs + profile context
    StudentDashboard.jsx     Central hub: stats, skill snapshot, top matches
    SkillGapAnalysis.jsx    Current vs. required proficiency, by target role
    OpportunityFeed.jsx     Internship listings ranked by match score
    ComingSoon.jsx          Placeholder for out-of-scope nav items
  data/
    mockDatabase.js         Normalized mock tables + join-style selectors
  App.jsx                    Routing + layout shell
  main.jsx                   Entry point
```

## Data model

`src/data/mockDatabase.js` models the domain the way a relational schema
would: `students`, `skills`, `student_skills` (join), `industry_roles`,
`role_requirements` (join), `companies`, and `opportunities`. Selector
functions at the bottom of the file perform the joins a real API would —
`getSkillGapAnalysis` and `getMatchedOpportunities` are the two the UI
consumes directly.

The default logged-in student is pre-populated as:

- **Name:** Vishal Chauhan
- **Enrollment No:** 08520803124
- **Current skills:** C++, JavaScript (ES6), Database Modeling
