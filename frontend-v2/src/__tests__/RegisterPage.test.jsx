import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import RegisterPage from '../pages/RegisterPage'

// Mock Firebase
vi.mock('../services/firebase', () => ({
  auth: {},
}))

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
}))

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('RegisterPage', () => {
  it('renderiza el formulario de registro con checkbox de accesibilidad', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    // Verificar que los campos básicos estén presentes
    const email = screen.getByPlaceholderText(/tú@correo\.com/i)
    const password = screen.getByPlaceholderText(/••••••••/)
    const submit = screen.getByRole('button', { name: /crear cuenta/i })

    expect(email).toBeInTheDocument()
    expect(password).toBeInTheDocument()
    expect(submit).toBeInTheDocument()

    // Verificar que el checkbox de accesibilidad esté presente
    const accessibilityCheckbox = screen.getByLabelText(/tengo dificultades visuales/i)
    const accessibilityDescription = screen.getByText(/esta opción activará automáticamente el modo de voz/i)

    expect(accessibilityCheckbox).toBeInTheDocument()
    expect(accessibilityDescription).toBeInTheDocument()
    expect(accessibilityCheckbox).toHaveAttribute('type', 'checkbox')
    expect(accessibilityCheckbox).not.toBeChecked()
  })

  it('permite marcar y desmarcar el checkbox de accesibilidad', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    const accessibilityCheckbox = screen.getByLabelText(/tengo dificultades visuales/i)
    
    // Inicialmente desmarcado
    expect(accessibilityCheckbox).not.toBeChecked()
    
    // Marcar el checkbox
    fireEvent.click(accessibilityCheckbox)
    expect(accessibilityCheckbox).toBeChecked()
    
    // Desmarcar el checkbox
    fireEvent.click(accessibilityCheckbox)
    expect(accessibilityCheckbox).not.toBeChecked()
  })

  it('tiene etiquetas de accesibilidad apropiadas', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    const accessibilityCheckbox = screen.getByLabelText(/tengo dificultades visuales/i)
    
    // Verificar que tiene aria-describedby
    expect(accessibilityCheckbox).toHaveAttribute('aria-describedby', 'visualDifficulty-description')
    
    // Verificar que el elemento descrito existe
    const description = document.getElementById('visualDifficulty-description')
    expect(description).toBeInTheDocument()
    expect(description).toHaveTextContent(/esta opción activará automáticamente el modo de voz/i)
  })
})
