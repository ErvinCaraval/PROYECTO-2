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
    // When open, the mobile container should expand (max-h-80)
    expect(document.querySelector('.max-h-80')).toBeTruthy()
  })
})

