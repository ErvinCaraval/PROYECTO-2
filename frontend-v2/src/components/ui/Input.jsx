import React from 'react'

const base = 'block w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/50 backdrop-blur-md transition focus:border-bb-primary focus:ring-2 focus:ring-bb-primary/30 focus:outline-none'

export default function Input({ className = '', ...props }) {
  return <input className={`${base} ${className}`} {...props} />
}

