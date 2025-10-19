import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import CompleteProfilePage from '../pages/CompleteProfilePage'

// Mock Firebase
vi.mock('../services/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-uid',
      email: 'test@example.com',
      getIdToken: vi.fn().mockResolvedValue('mock-token'),
    },
  },
  db: {},
}))

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  updateProfile: vi.fn(),
}))

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
}))

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

// Mock fetch
global.fetch = vi.fn()

describe('CompleteProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })
  })

  it('renderiza el formulario de completar perfil con checkbox de accesibilidad', () => {
    render(
      <MemoryRouter>
        <CompleteProfilePage />
      </MemoryRouter>
    )

    // Verificar que los campos básicos estén presentes
    const displayName = screen.getByPlaceholderText(/tu nombre/i)
    const submit = screen.getByRole('button', { name: /guardar/i })

    expect(displayName).toBeInTheDocument()
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
        <CompleteProfilePage />
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
        <CompleteProfilePage />
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

  it('envía el estado del checkbox al backend al guardar', async () => {
    render(
      <MemoryRouter>
        <CompleteProfilePage />
      </MemoryRouter>
    )

    const displayName = screen.getByPlaceholderText(/tu nombre/i)
    const accessibilityCheckbox = screen.getByLabelText(/tengo dificultades visuales/i)
    const submit = screen.getByRole('button', { name: /guardar/i })

    // Llenar el formulario
    fireEvent.change(displayName, { target: { value: 'Test User' } })
    fireEvent.click(accessibilityCheckbox)

    // Enviar el formulario
    fireEvent.click(submit)

    // Verificar que se llamó a fetch con los datos correctos
    await new Promise(resolve => setTimeout(resolve, 100)) // Esperar a que se ejecute el async

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/me/profile'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        }),
        body: JSON.stringify({
          displayName: 'Test User',
          visualDifficulty: true,
        }),
      })
    )
  })
})
