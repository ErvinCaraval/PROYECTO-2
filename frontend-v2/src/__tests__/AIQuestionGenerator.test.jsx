/* global require */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from './testUtils'
import React from 'react'
import { act } from 'react-dom/test-utils'
import AIQuestionGenerator from '../components/AIQuestionGenerator'

// Mock del hook useAuth y AuthProvider
vi.mock('../AuthContext', () => {
  const React = require('react')
  return {
    useAuth: () => ({
      user: {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        getIdToken: () => Promise.resolve('mocked-token') // Mock de getIdToken
      },
      loading: false
    }),
    AuthProvider: ({ children }) => React.createElement(React.Fragment, null, children)
  }
})

// Mock de las funciones de API
vi.mock('../services/api', () => ({
  fetchTopics: vi.fn(() => Promise.resolve(['Matemáticas', 'Historia', 'Ciencia'])),
  fetchDifficultyLevels: vi.fn(() => Promise.resolve(['Fácil', 'Medio', 'Difícil']))
}))

describe('AIQuestionGenerator (mobile-friendly cantidad)', () => {
  it('starts with empty cantidad and accepts only numbers', async () => {
    const onGenerated = vi.fn()
    const onClose = vi.fn()

    // Render dentro de act()
    await act(async () => {
      render(<AIQuestionGenerator onQuestionsGenerated={onGenerated} onClose={onClose} />)
    })

    // Buscar el botón de manera asincrónica
    const button = await screen.findByText('Crear con IA')

    // Click dentro de act()
    await act(async () => {
      fireEvent.click(button)
    })

    const input =
      screen.getByLabelText('Cantidad', { selector: 'input' }) ||
      screen.getByPlaceholderText('Cantidad')

    expect(input.value).toBe('')

    // Escribir letras + números, debe filtrar letras
    await act(async () => {
      fireEvent.change(input, { target: { value: 'a1b2' } })
    })
    expect(input.value).toBe('12')

    // Vaciar deja el campo sin valor válido
    await act(async () => {
      fireEvent.change(input, { target: { value: '' } })
    })
    expect(input.value).toBe('')
  })
})
