import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

// 🧩 Mock del hook useVoice para evitar errores durante las pruebas
vi.mock('@/hooks/useVoice', () => ({
  useVoice: () => ({
    isVoiceModeEnabled: false,
    speak: vi.fn(),
  }),
}));

describe('LoginPage', () => {
  it('renderiza el formulario de login', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    // Buscar elementos clave del formulario
    const email = screen.getByPlaceholderText(/correo|email|correo electrónico/i);
    const password = screen.getByPlaceholderText(/•+/i); // Acepta cualquier secuencia de puntos
    const submit = screen.getByRole('button', { name: /iniciar sesión|login|submit/i });

    // Verificar que existan
    expect(email).toBeInTheDocument();
    expect(password).toBeInTheDocument();
    expect(submit).toBeInTheDocument();
  });
});
