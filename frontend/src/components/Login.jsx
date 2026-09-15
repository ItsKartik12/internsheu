import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Building2,
  BookOpen,
  UserCheck,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { loginUser, registerUser } from '../services/api'
import { getUserByIdentifier } from '../data/mockDatabase'

function resolveLandingPath(role, from) {
  if (from && from !== '/login') return from
  switch (role) {
    case 'admin':
      return '/admin'
    case 'educator':
      return '/educator'
    case 'industry':
      return '/industry'
    case 'student':
    default:
      return '/'
  }
}

const DEMO_ACCOUNTS = [
  {
    role: 'student',
    title: 'Student',
    email: 'student@internsheu.edu',
    password: 'password123',
    icon: GraduationCap,
    badge: 'SIH Finalist',
    color: 'border-teal-200 bg-teal-50/60 text-teal-700 hover:border-teal-400',
  },
  {
    role: 'educator',
    title: 'Educator',
    email: 'educator@internsheu.edu',
    password: 'password123',
    icon: BookOpen,
    badge: 'Faculty',
    color: 'border-blue-200 bg-blue-50/60 text-blue-700 hover:border-blue-400',
  },
  {
    role: 'industry',
    title: 'Industry Partner',
    email: 'industry@internsheu.edu',
    password: 'password123',
    icon: Building2,
    badge: 'Recruiter',
    color: 'border-indigo-200 bg-indigo-50/60 text-indigo-700 hover:border-indigo-400',
  },
  {
    role: 'admin',
    title: 'Administrator',
    email: 'admin@internsheu.edu',
    password: 'password123',
    icon: ShieldCheck,
    badge: 'Institutional',
    color: 'border-purple-200 bg-purple-50/60 text-purple-700 hover:border-purple-400',
  },
]

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const redirectFrom = location.state?.from

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('student@internsheu.edu')
  const [password, setPassword] = useState('password123')
  const [name, setName] = useState('')
  const [role, setRole] = useState('student')
  const [enrollmentNo, setEnrollmentNo] = useState('')
  const [fieldMark, setFieldMark] = useState('Computer Science')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  function handleSelectDemo(acc) {
    setEmail(acc.email)
    setPassword(acc.password)
    setError('')
    setSuccessMsg(`Loaded ${acc.title} credentials. Click "Sign in" below!`)
  }

  async function handleLoginSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return

    setError('')
    setSuccessMsg('')
    setIsSubmitting(true)

    try {
      // 1. Try real backend authentication
      const result = await loginUser(email.trim(), password)
      if (result?.token && result?.user) {
        login(result)
        navigate(resolveLandingPath(result.user.role, redirectFrom), { replace: true })
        return
      }
    } catch (err) {
      console.warn('Backend login attempt:', err.message)
      // If backend responded with invalid credentials from DB:
      if (err.status === 401 || err.status === 400) {
        // Check if matching mock user exists as fallback for offline demo
        const mockMatch = getUserByIdentifier(email)
        if (mockMatch && (password === 'password123' || password === '123456')) {
          login({ user: mockMatch })
          navigate(resolveLandingPath(mockMatch.role, redirectFrom), { replace: true })
          return
        }
        setError(err.message || 'Invalid email or password')
        setIsSubmitting(false)
        return
      }

      // If backend is not reachable / network error, fall back gracefully to role mapping for testing
      const matchedDemo = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase())
      if (matchedDemo) {
        const fallbackUser = {
          _id: `demo-${matchedDemo.role}`,
          name: matchedDemo.title + ' User',
          email: matchedDemo.email,
          role: matchedDemo.role,
          enrollmentNo: matchedDemo.role === 'student' ? '2024CS001' : undefined,
          studentId: matchedDemo.role === 'student' ? 'STU-001' : undefined,
        }
        login({ user: fallbackUser })
        navigate(resolveLandingPath(fallbackUser.role, redirectFrom), { replace: true })
        return
      }

      setError(err.message || 'Connection to authentication service failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) return
    if (role === 'student' && !enrollmentNo.trim()) {
      setError('Enrollment number is required for students.')
      return
    }

    setError('')
    setSuccessMsg('')
    setIsSubmitting(true)

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        enrollmentNo: role === 'student' ? enrollmentNo.trim() : undefined,
        fieldMark: role === 'student' ? fieldMark : undefined,
      }

      const res = await registerUser(payload)
      if (res?.token && res?.user) {
        login(res)
        navigate(resolveLandingPath(res.user.role, redirectFrom), { replace: true })
        return
      }
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[480px] lg:shrink-0 lg:px-14">
        <div className="mx-auto w-full max-w-sm">
          {/* Brand header */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/15">
              <GraduationCap size={20} className="text-teal-600" strokeWidth={2.25} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">internsetu</p>
              <p className="text-[11px] text-slate-500">Academia × Industry Portal</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>

          {mode === 'login' ? (
            <>
              <h1 className="mt-6 text-xl font-bold text-slate-900">Welcome Back</h1>
              <p className="mt-1 text-xs text-slate-500">
                Sign in with your email and password to access your role-based portal.
              </p>

              {/* Demo Accounts Quick-Picker */}
              <div className="mt-5 space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Quick Demo Accounts (Click to fill)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => {
                    const Icon = acc.icon
                    const isSelected = email.toLowerCase() === acc.email.toLowerCase()
                    return (
                      <button
                        key={acc.role}
                        type="button"
                        onClick={() => handleSelectDemo(acc)}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          <Icon size={14} className="text-slate-700" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-900">{acc.title}</p>
                          <p className="text-[10px] text-slate-500">{acc.badge}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-700">Email Address</label>
                  <div className="relative mt-1">
                    <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@internsetu.edu"
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Password</label>
                  <div className="relative mt-1">
                    <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {successMsg && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-700">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {error && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 disabled:opacity-60"
                >
                  {isSubmitting ? 'Signing in…' : 'Sign in'}
                  {!isSubmitting && <ArrowRight size={15} />}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="mt-6 text-xl font-bold text-slate-900">Create New Account</h1>
              <p className="mt-1 text-xs text-slate-500">
                Join internsetu to access courses, internships, and skill assessments.
              </p>

              <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-slate-700">I am joining as a</label>
                  <div className="mt-1 grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'student', label: 'Student' },
                      { id: 'educator', label: 'Educator' },
                      { id: 'industry', label: 'Industry' },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={`rounded-lg border py-1.5 text-xs font-medium transition-all ${
                          role === r.id
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {role === 'student' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-700">Enrollment No</label>
                      <input
                        type="text"
                        required
                        value={enrollmentNo}
                        onChange={(e) => setEnrollmentNo(e.target.value)}
                        placeholder="2024CS001"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">Discipline</label>
                      <select
                        value={fieldMark}
                        onChange={(e) => setFieldMark(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 shadow-sm outline-none focus:border-indigo-500"
                      >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Technology">Information Tech</option>
                        <option value="Electrical Engineering">Electrical</option>
                        <option value="Electronics & Communication">Electronics</option>
                        <option value="Mechanical Engineering">Mechanical</option>
                        <option value="Civil Engineering">Civil</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-slate-700">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 disabled:opacity-60"
                >
                  {isSubmitting ? 'Creating account…' : 'Register Now'}
                  <UserCheck size={15} />
                </button>
              </form>
            </>
          )}

          <p className="mt-8 text-center text-xs text-slate-400">
            Smart India Hackathon 2026 · Academia-Industry Collaboration Platform
          </p>
        </div>
      </div>

      {/* Visual Branding Hero Panel */}
      <div className="relative hidden flex-1 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-400/10 px-3 py-1 text-xs font-semibold text-teal-300 ring-1 ring-inset ring-teal-400/20">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
              SIH 2026 Active Portal
            </span>
          </div>

          <div className="max-w-lg space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Unifying Academia, Students & Industry
            </h2>
            <p className="text-base text-slate-300 leading-relaxed">
              Empowering students with automated skill assessments, AI-driven opportunity matching, verified course credentials, and direct hiring pipelines.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="rounded-md bg-white/10 px-2.5 py-1">✓ MCQ Skill Assessments</span>
              <span className="rounded-md bg-white/10 px-2.5 py-1">✓ Real-time Skill Gap Analysis</span>
              <span className="rounded-md bg-white/10 px-2.5 py-1">✓ Verified Course Modules</span>
              <span className="rounded-md bg-white/10 px-2.5 py-1">✓ Direct Internship Applications</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
            <div>
              <p className="text-2xl font-bold text-white">120+</p>
              <p className="text-xs text-slate-400">Partner Companies</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">4,800+</p>
              <p className="text-xs text-slate-400">Active Students</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">94%</p>
              <p className="text-xs text-slate-400">Verified Placement Match</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
