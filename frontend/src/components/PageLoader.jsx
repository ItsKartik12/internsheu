import React from 'react'

export default function PageLoader({ message = 'Loading workspace…' }) {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-3 border-teal-500 border-t-transparent"></div>
      <p className="mt-4 text-xs font-medium text-slate-500">{message}</p>
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  )
}
