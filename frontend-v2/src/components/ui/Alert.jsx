import React from 'react'

const intentToStyles = {
  success: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
  error: 'bg-red-500/15 text-red-200 border-red-400/30',
  info: 'bg-indigo-500/15 text-indigo-200 border-indigo-400/30',
}

export default function Alert({ intent = 'info', children, className = '', ...props }) {
  const styles = intentToStyles[intent] ?? intentToStyles.info
  return (
    <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${styles} ${className}`} {...props}>
      {children}
    </div>
  )
}

