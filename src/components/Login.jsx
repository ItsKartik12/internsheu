import { useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GraduationCap, Mail, ShieldCheck, ArrowRight, ArrowLeft, RotateCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getUserByIdentifier } from '../data/mockDatabase'

const OTP_LENGTH = 6
const DEMO_OTP = '123456'

function resolveLandingPath(role, from) {
  if (role === 'admin') {
    return from && from.startsWith('/admin') ? from : '/admin'
  }
  // student (or any non-admin role) is never allowed onto /admin routes
  return from && !from.startsWith('/admin') ? from : '/'
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const redirectFrom = location.state?.from

  const [step, setStep] = useState('identifier') // 'identifier' | 'otp'
  const [identifier, setIdentifier] = useState('vishal.chauhan@bpit.ac.in')
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const otpRefs = useRef([])

  function handleSendOtp(e) {
    e.preventDefault()
    if (!identifier.trim()) return
    setError('')
    setIsSubmitting(true)

    // Simulated OTP dispatch. Wire a real POST /api/auth/otp/send here.
    setTimeout(() => {
      setIsSubmitting(false)
      setStep('otp')
      setOtp(Array(OTP_LENGTH).fill(''))
      requestAnimationFrame(() => otpRefs.current[0]?.focus())
    }, 500)
  }

  function handleOtpChange(index, rawValue) {
    const value = rawValue.replace(/\D/g, '').slice(-1)
    setOtp((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  function handleOtpPaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    e.preventDefault()
    setOtp((prev) => {
      const next = [...prev]
      for (let i = 0; i < OTP_LENGTH; i += 1) next[i] = pasted[i] ?? ''
      return next
    })
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
  }

  function handleVerifyOtp(e) {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < OTP_LENGTH) {
      setError('Enter all 6 digits.')
      return
    }

    setError('')
    setIsSubmitting(true)

    // Simulated OTP verification + role lookup. Wire a real
    // POST /api/auth/otp/verify here and let the backend return the role.
    setTimeout(() => {
      setIsSubmitting(false)

      if (code !== DEMO_OTP) {
        setError(`Incorrect code. Use ${DEMO_OTP} for this demo build.`)
        setOtp(Array(OTP_LENGTH).fill(''))
        otpRefs.current[0]?.focus()
        return
      }

      const matchedUser = getUserByIdentifier(identifier)
      if (!matchedUser) {
        setError(`No account found for "${identifier}". Contact your institute admin.`)
        return
      }

      login(matchedUser)
      navigate(resolveLandingPath(matchedUser.role, redirectFrom), { replace: true })
    }, 500)
  }

  function handleChangeIdentifier() {
    setStep('identifier')
    setOtp(Array(OTP_LENGTH).fill(''))
    setError('')
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

          {step === 'identifier' ? (
            <>
              <h1 className="mt-10 text-xl font-semibold text-slate-900">Sign in to your account</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Enter your institute email or registered phone number to receive a one-time code.
              </p>

              <form onSubmit={handleSendOtp} className="mt-8 space-y-4">
                <div>
                  <label htmlFor="identifier" className="text-sm font-medium text-slate-700">
                    Email or phone number
                  </label>
                  <div className="relative mt-1.5">
                    <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-card outline-none transition-colors focus:border-indigo-400"
                      placeholder="you@institute.ac.in"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-70"
                >
                  {isSubmitting ? 'Sending code…' : 'Send OTP'}
                  {!isSubmitting && <ArrowRight size={15} />}
                </button>
              </form>

              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-500 shadow-card">
                <p className="font-medium text-slate-700">Demo accounts</p>
                <p className="mt-1">Student: vishal.chauhan@bpit.ac.in</p>
                <p>Admin: admin@internsheu.com</p>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleChangeIdentifier}
                className="mt-10 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft size={13} />
                Change email or phone number
              </button>

              <div className="mt-3 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <ShieldCheck size={20} />
              </div>

              <h1 className="mt-4 text-xl font-semibold text-slate-900">Enter verification code</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                We've sent a 6-digit code to <span className="font-medium text-slate-700">{identifier}</span>.
              </p>

              <form onSubmit={handleVerifyOtp} className="mt-8 space-y-5">
                <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="h-12 w-11 rounded-xl border border-slate-200 text-center text-lg font-semibold text-slate-900 shadow-card outline-none transition-colors focus:border-indigo-400"
                    />
                  ))}
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-70"
                >
                  {isSubmitting ? 'Verifying…' : 'Verify & sign in'}
                  {!isSubmitting && <ArrowRight size={15} />}
                </button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-500"
                >
                  <RotateCw size={12} />
                  Resend code
                </button>
              </form>

              <p className="mt-6 rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-500 shadow-card">
                Demo build — use code <span className="font-semibold text-slate-700">{DEMO_OTP}</span> to verify.
              </p>
            </>
          )}

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
