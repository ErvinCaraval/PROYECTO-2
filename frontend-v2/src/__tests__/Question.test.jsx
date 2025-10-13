import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import Question from '../components/Question'

describe('Question component', () => {
  const options = ['a', 'b', 'c', 'd']
  it('renders title and options and allows selection', () => {
    const onSelect = vi.fn()
    render(<Question text="Pregunta?" options={options} onSelect={onSelect} selected={null} />)
    expect(screen.getByText('Pregunta?')).toBeInTheDocument()
    fireEvent.click(screen.getByText('a'))
    expect(onSelect).toHaveBeenCalled()
  })
  it('shows result styles when showResult is true', () => {
    render(<Question text="Pregunta?" options={options} onSelect={() => {}} selected={1} showResult correctIndex={2} />)
    expect(screen.getByText('c')).toBeInTheDocument()
  })
})

