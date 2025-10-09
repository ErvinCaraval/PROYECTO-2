import React from 'react'

export function Card({ className = '', children, ...props }) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl shadow-md ${className}`}
      {...props}
    >
      {children}
    </section>
  )
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <header className={`px-6 pt-6 ${className}`} {...props}>
      {children}
    </header>
  )
}

export function CardBody({ className = '', children, ...props }) {
  return (
    <div className={`px-6 pb-6 ${className}`} {...props}>
      {children}
    </div>
  )
}

