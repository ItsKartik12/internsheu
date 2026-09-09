import { Construction } from 'lucide-react'

export default function ComingSoon({ title }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-24 text-center shadow-card">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Construction size={22} />
      </div>
      <h1 className="mt-4 text-base font-semibold text-slate-900">{title}</h1>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500">
        This module is being wired into the SIH build. Core dashboard, skill gap, and
        opportunity matching are fully functional.
      </p>
    </div>
  )
}
