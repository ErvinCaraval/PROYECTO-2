import React from 'react'

const variants = {
  primary: 'bg-bb-primary/20 text-bb-primary ring-bb-primary/30',
  amber: 'bg-amber-400/15 text-amber-300 ring-amber-400/30',
  emerald: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30',
  violet: 'bg-violet-400/15 text-violet-300 ring-violet-400/30',
  slate: 'bg-white/10 text-white/80 ring-white/20',
}

export default function Badge({ children, variant = 'slate', className = '' }) {
  const style = variants[variant] ?? variants.slate
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style} ${className}`}>
      {children}
    </span>
  )
}

