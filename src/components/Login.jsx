import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GraduationCap, Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState('vishal.chauhan@bpit.ac.in')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = location.state?.from ?? '/'

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    // Demo build: auth is bypassed. Wire a real POST /api/auth/login here
    // and gate navigation on its response when the backend is ready.
    setTimeout(() => {
      login()
      navigate(redirectTo, { replace: true })
    }, 400)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[440px] lg:shrink-0 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/15">
              <GraduationCap size={20} className="text-teal-600" strokeWidth={2.25} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">internsheu</p>
              <p className="text-[11px] text-slate-500">Academia × Industry</p>
            </div>
          </div>

          <h1 className="mt-10 text-xl font-semibold text-slate-900">Sign in to your account</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Access your dashboard, skill reports, and matched opportunities.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Institute email
              </label>
              <div className="relative mt-1.5">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-card outline-none transition-colors focus:border-indigo-400"
                  placeholder="you@institute.ac.in"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <button type="button" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </button>
              </div>
              <div className="relative mt-1.5">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-card outline-none transition-colors focus:border-indigo-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 text-sm text-slate-600">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400" />
              Keep me signed in
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-70"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
              {!submitting && <ArrowRight size={15} />}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Demo build for SIH 2026 — authentication is simulated.
          </p>
        </div>
      </div>

      {/* Visual panel */}
      <div className="relative hidden flex-1 bg-slate-900 lg:block">
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <div />
          <div className="max-w-md">
            <p className="text-2xl font-medium leading-snug text-white">
              "Matching student skill profiles to verified industry demand, at national scale."
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Smart India Hackathon 2026 · Academia-Industry Collaboration Portal
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
            <div>
              <p className="text-lg font-semibold text-white">120+</p>
              <p className="text-xs text-slate-500">Partner companies</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">4,800</p>
              <p className="text-xs text-slate-500">Students onboarded</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">92%</p>
              <p className="text-xs text-slate-500">Match accuracy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
