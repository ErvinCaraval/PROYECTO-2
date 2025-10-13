import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../components/Navbar'

describe('Navbar mobile menu', () => {
  it('toggles mobile drawer', () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>)
    const btn = screen.getByLabelText('Abrir menú')
    fireEvent.click(btn)
    // When open, the mobile container should expand (max-h-80)
    expect(document.querySelector('.max-h-80')).toBeTruthy()
  })
})

