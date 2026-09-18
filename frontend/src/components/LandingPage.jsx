import { Link } from 'react-router-dom'
import {
  GraduationCap,
  Briefcase,
  Building2,
  BookOpen,
  Code2,
  Video,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Target,
  FileCheck2,
  Layers,
  ChevronRight,
  Search,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 ring-1 ring-teal-500/30">
              <GraduationCap size={20} className="text-teal-600" strokeWidth={2.25} />
            </div>
            <div className="leading-tight">
              <span className="text-base font-extrabold tracking-tight text-slate-900">InternSetu</span>
              <span className="block text-[10px] font-medium text-slate-500">Academia × Industry Portal</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-xs font-semibold text-slate-600 md:flex">
            <Link to="/internships" className="transition hover:text-teal-600">Internships</Link>
            <Link to="/jobs" className="transition hover:text-teal-600">Career Jobs</Link>
            <Link to="/courses" className="transition hover:text-teal-600">Verified Courses</Link>
            <a href="#features" className="transition hover:text-teal-600">Platform Features</a>
            <a href="#academia-industry" className="transition hover:text-teal-600">For Universities</a>
            <a href="#industry" className="transition hover:text-teal-600">For Industry</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              state={{ mode: 'register' }}
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-500"
            >
              Get Started <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100 py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/80 px-3 py-1 text-xs font-semibold text-teal-800 shadow-sm">
              <Sparkles size={13} className="text-teal-600" />
              <span>Academia-Industry Collaboration Platform</span>
            </div>

            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl sm:leading-tight">
              The Intelligent Bridge Between <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-teal-600 to-indigo-600 bg-clip-text text-transparent">
                Engineering Curriculum and Industry Roles
              </span>
            </h1>

            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              InternSetu connects engineering students, academic institutions, and industry recruiters through automated skill mapping, standardized MCQ evaluations, algorithmic DSA contests, and verified hiring pipelines.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/internships"
                className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-500"
              >
                <Briefcase size={16} />
                Explore Internships
              </Link>
              <Link
                to="/jobs"
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <Search size={16} />
                Browse Jobs
              </Link>
              <Link
                to="/courses"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                <BookOpen size={16} />
                Browse Courses
              </Link>
            </div>

            {/* Core Capability Pillars */}
            <div className="mt-12 grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-8 sm:grid-cols-4">
              <div className="rounded-xl bg-white p-3.5 border border-slate-200/70 shadow-xs">
                <p className="text-xs font-bold text-slate-900">MCQ Assessments</p>
                <p className="mt-1 text-[11px] text-slate-500">Standardized Core CS & Web Tests</p>
              </div>
              <div className="rounded-xl bg-white p-3.5 border border-slate-200/70 shadow-xs">
                <p className="text-xs font-bold text-teal-700">DSA Contests</p>
                <p className="mt-1 text-[11px] text-slate-500">Real-time Problem Solving</p>
              </div>
              <div className="rounded-xl bg-white p-3.5 border border-slate-200/70 shadow-xs">
                <p className="text-xs font-bold text-indigo-700">AI Mock Interview</p>
                <p className="mt-1 text-[11px] text-slate-500">Interactive Technical Preparation</p>
              </div>
              <div className="rounded-xl bg-white p-3.5 border border-slate-200/70 shadow-xs">
                <p className="text-xs font-bold text-purple-700">Candidate Matrix</p>
                <p className="mt-1 text-[11px] text-slate-500">Multi-Factor Skill Ranking</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Ecosystem Pillars */}
      <section id="features" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-600">Architecture & Features</h2>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Engineered for Complete Transparency and Measurable Skills
            </p>
            <p className="mt-2 max-w-2xl mx-auto text-sm text-slate-600">
              Traditional campus placements rely on static resumes. InternSetu replaces guesswork with verified competency evidence.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Pillar 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
                <Target size={20} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Automated Skill Gap Analysis</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Maps student academic profiles against target industry roles (Frontend, Backend, DevOps, Data Science) to pinpoint exact missing technologies and frameworks.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <Award size={20} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Standardized Skill Assessments</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Timed, proctored MCQ assessments covering Core Computer Science (DSA, DBMS, OS, Networks) and modern Web & Cloud stacks with instant benchmarking.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                <Code2 size={20} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">DSA Coding Contests</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Real-world algorithmic problem solving with VJudge execution. Automated test case verification, live leaderboards, and recruiter-visible solve counts.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                <Video size={20} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">AI Mock Video Interview</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Simulated AI interviewer analyzing technical responses, communication cadence, and behavioral readiness for high-stakes corporate hiring rounds.
              </p>
            </div>

            {/* Pillar 5 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Building2 size={20} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Candidate Screening Matrix</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Recruiters configure custom scoring weights across Assessments, DSA, and Interviews to rank thousands of applicants objectively with privacy-safe contact unlocking.
              </p>
            </div>

            {/* Pillar 6 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <FileCheck2 size={20} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Application Pipeline Tracking</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                End-to-end status visibility for both internships and full-time jobs. Track applied positions, company review stages, external portal visits, and shortlisting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Audience Section: Students vs Industry */}
      <section id="academia-industry" className="border-t border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            {/* Left: For Students */}
            <div className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50/50 via-white to-slate-50 p-8 shadow-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">
                <GraduationCap size={14} /> For Engineering Students
              </span>
              <h3 className="mt-4 text-2xl font-bold text-slate-900">Turn Academic Learning into Industry Hiring</h3>
              <p className="mt-2 text-sm text-slate-600">
                Stop applying blindly to job boards with generic PDFs. InternSetu validates your skills and showcases your actual coding proficiency directly to partner recruiters.
              </p>
              <ul className="mt-6 space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Personalized Skill Scorecard:</strong> Comprehensive ratings across DSA, core CS topics, and AI interview simulations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Faculty-Verified Courses:</strong> Curated curriculum modules bridging identified technical gaps.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Direct Placement Pipeline:</strong> Verified students are shortlisted and directly contacted by top companies.</span>
                </li>
              </ul>
              <div className="mt-8">
                <Link
                  to="/internships"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-teal-500"
                >
                  Browse Student Opportunities <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            {/* Right: For Industry & Recruiters */}
            <div id="industry" className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 p-8 shadow-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
                <Building2 size={14} /> For Industry Recruiters
              </span>
              <h3 className="mt-4 text-2xl font-bold text-slate-900">Hire Verified Talent with Objective Evidence</h3>
              <p className="mt-2 text-sm text-slate-600">
                Eliminate hundreds of hours wasted filtering unverified resumes. InternSetu's algorithmic Candidate Matrix benchmarks applicant cohorts using real assessments.
              </p>
              <ul className="mt-6 space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>Custom Scoring Weights:</strong> Calibrate importance across Assessments (MCQ), DSA problem solving, and AI Interviews.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>Recruitment Pipelines:</strong> Seamlessly move candidates between Matched, Shortlisted, and Selected stages.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>Data Privacy Compliance:</strong> Candidate contacts remain masked until recruiters unlock verified talent.</span>
                </li>
              </ul>
              <div className="mt-8">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500"
                >
                  Recruiter Sign In <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="border-t border-slate-200 bg-slate-900 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-extrabold sm:text-4xl">
            Empower Your Engineering Career or Accelerate Tech Hiring
          </h2>
          <p className="mt-3 text-sm text-slate-300 sm:text-base max-w-2xl mx-auto">
            Join thousands of students and faculty from engineering colleges across India participating in standardized skill evaluation and verified hiring.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              state={{ mode: 'register' }}
              className="rounded-xl bg-teal-500 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-teal-400"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Public Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-teal-600" />
            <span className="font-bold text-slate-800">InternSetu</span>
            <span>· Academia-Industry Collaboration Platform</span>
          </div>

          <div className="flex flex-wrap gap-4 text-slate-600 font-medium">
            <Link to="/internships" className="hover:text-teal-600 transition">Internships</Link>
            <Link to="/jobs" className="hover:text-teal-600 transition">Career Jobs</Link>
            <Link to="/courses" className="hover:text-teal-600 transition">Courses</Link>
            <Link to="/login" className="hover:text-teal-600 transition">Login</Link>
          </div>

          <p className="text-slate-400">
            © 2026 InternSetu · Academia-Industry Collaboration Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
