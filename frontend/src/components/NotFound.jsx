import { Link } from 'react-router-dom'
import { AlertTriangle, Home, Briefcase, Building2, BookOpen, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="mx-auto max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
          <AlertTriangle size={32} />
        </div>

        <span className="mt-6 inline-block rounded-full bg-slate-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-700">
          404 — Page Not Found
        </span>

        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          We couldn’t find that page
        </h1>

        <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
          The link you followed may be broken, or the page may have been moved or removed from InternSetu.
        </p>

        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-500"
          >
            <Home size={15} />
            Back to Home
          </Link>
          <Link
            to="/internships"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Briefcase size={15} />
            Browse Internships
          </Link>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <p className="text-xs text-slate-400">
            Looking for something else?
          </p>
          <div className="mt-2 flex justify-center gap-4 text-xs font-medium text-slate-600">
            <Link to="/jobs" className="hover:text-teal-600 transition">Career Jobs</Link>
            <span className="text-slate-300">·</span>
            <Link to="/courses" className="hover:text-teal-600 transition">Verified Courses</Link>
            <span className="text-slate-300">·</span>
            <Link to="/login" className="hover:text-teal-600 transition">Portal Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
