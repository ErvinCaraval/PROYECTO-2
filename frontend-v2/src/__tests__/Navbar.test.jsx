import { describe, it, expect } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import React from 'react'
import Navbar from '../components/Navbar'
import { renderWithProviders } from './testUtils'

describe('Navbar mobile menu', () => {
  it('toggles mobile drawer', () => {
    renderWithProviders(<Navbar />)
    const btn = screen.getByLabelText('Abrir menú')
    fireEvent.click(btn)
    // When open, the mobile menu should be visible with the specific class
    expect(document.querySelector('.md\\:hidden')).toHaveClass('bg-bb-bg-secondary/95')
  })
})

