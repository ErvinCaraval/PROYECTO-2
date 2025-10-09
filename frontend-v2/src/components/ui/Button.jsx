import React from 'react'

const base = 'inline-flex items-center justify-center whitespace-nowrap rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bb-bg-primary disabled:opacity-50 disabled:cursor-not-allowed'

const variants = {
  primary: 'bg-gradient-to-br from-bb-primary to-bb-accent text-white shadow-md hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0',
  secondary: 'bg-white/5 text-white border border-white/10 backdrop-blur hover:bg-white/10',
  outline: 'bg-transparent text-white border-2 border-bb-primary hover:bg-bb-primary hover:text-white',
  ghost: 'bg-transparent text-white hover:bg-white/10',
}

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-[0.95rem]',
  lg: 'h-12 px-6 text-base',
}

export default function Button({ as: Comp = 'button', variant = 'primary', size = 'md', className = '', children, ...props }) {
  const classes = `${base} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`
  return (
    <Comp className={classes} {...props}>
      {children}
    </Comp>
  )
}

