import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useVoice } from '../VoiceContext'

function MenuIcon({ open }) {
  return (
    <div className="relative w-6 h-6">
      <span className={`block h-0.5 w-6 bg-white transition-transform ${open ? 'rotate-45 translate-y-2' : ''}`}></span>
      <span className={`block h-0.5 w-6 bg-white my-1 transition-opacity ${open ? 'opacity-0' : 'opacity-100'}`}></span>
      <span className={`block h-0.5 w-6 bg-white transition-transform ${open ? '-rotate-45 -translate-y-2' : ''}`}></span>
    </div>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'
  const { isVoiceModeEnabled, toggleVoiceMode, isVoiceAvailable, speak } = useVoice()

  const announce = (text) => {
    if (isVoiceModeEnabled) {
      // Short, non-blocking guidance
      speak(text, { action: 'text_read', questionId: 'nav', metadata: { origin: 'navbar' } })
    }
  }

  return (
    <header className="bg-transparent backdrop-blur-md border-white/10 border-b w-full py-2">
      <div className="flex justify-between items-center mx-auto px-4 py-3 container">
        <Link
          to="/"
          className="flex items-center gap-3"
          onClick={() => setOpen(false)}
          onFocus={() => announce('Inicio, ir a la página principal')}
          onMouseEnter={() => announce('Inicio, ir a la página principal')}
        >
          <div className="flex justify-center items-center bg-gradient-to-br from-bb-primary to-bb-accent rounded-md w-10 h-10 font-bold text-xl">⚡</div>
          <span className="font-bold text-lg">BrainBlitz</span>
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          {!isHome && (
            <Link
              to="/"
              className="text-sm hover:underline"
              onFocus={() => announce('Ir a Inicio')}
              onMouseEnter={() => announce('Ir a Inicio')}
            >
              Inicio
            </Link>
          )}
          <Link
            to="/dashboard"
            className="text-sm hover:underline"
            onFocus={() => announce('Ir al Panel')}
            onMouseEnter={() => announce('Ir al Panel')}
          >
            Panel
          </Link>
          {!isHome && (
            <Link
              to="/ranking"
              className="text-sm hover:underline"
              onFocus={() => announce('Ir al Ranking')}
              onMouseEnter={() => announce('Ir al Ranking')}
            >
              Ranking
            </Link>
          )}
          
          {/* Voice Mode Toggle */}
          {isVoiceAvailable && (
            <button
              onClick={() => {
                const nextEnabled = !isVoiceModeEnabled
                toggleVoiceMode()
                announce(nextEnabled ? 'Modo de voz activado' : 'Modo de voz desactivado')
                if (nextEnabled) {
                  // Brief onboarding describing the navbar
                  announce('Barra de navegación: Inicio, Panel, Ranking e Iniciar sesión. Usa tab para moverte y enter para activar.')
                }
              }}
              className={`px-3 py-2 rounded-md text-sm transition-colors ${
                isVoiceModeEnabled 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-600 text-white hover:bg-gray-500'
              }`}
              title={isVoiceModeEnabled ? 'Desactivar modo de voz' : 'Activar modo de voz'}
              onFocus={() => announce('Alternar modo de voz')}
              onMouseEnter={() => announce('Alternar modo de voz')}
            >
              🎤 {isVoiceModeEnabled ? 'Voz ON' : 'Voz OFF'}
            </button>
          )}
          
          <Link
            to="/login"
            className="bg-bb-primary px-3 py-2 rounded-md text-sm"
            onFocus={() => announce('Ir a Iniciar sesión')}
            onMouseEnter={() => announce('Ir a Iniciar sesión')}
          >
            Iniciar
          </Link>
        </nav>

        <button
          aria-label="Abrir menú"
          aria-expanded={open}
          className="md:hidden p-3 rounded-md"
          onClick={() => setOpen((v) => !v)}
        >
          <MenuIcon open={open} />
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`md:hidden bg-bb-bg-primary/95 border-t border-white/5 transition-[max-height] duration-300 overflow-hidden ${open ? 'max-h-80' : 'max-h-0'}`}>
        <div className="flex flex-col gap-2 px-4 py-4">
          {!isHome && (
            <Link
              to="/"
              className="block px-3 py-3 rounded-md text-base"
              onClick={() => setOpen(false)}
              onFocus={() => announce('Ir a Inicio')}
              onMouseEnter={() => announce('Ir a Inicio')}
            >
              Inicio
            </Link>
          )}
          <Link
            to="/dashboard"
            className="block px-3 py-3 rounded-md text-base"
            onClick={() => setOpen(false)}
            onFocus={() => announce('Ir al Panel')}
            onMouseEnter={() => announce('Ir al Panel')}
          >
            Panel
          </Link>
          {!isHome && (
            <Link
              to="/ranking"
              className="block px-3 py-3 rounded-md text-base"
              onClick={() => setOpen(false)}
              onFocus={() => announce('Ir al Ranking')}
              onMouseEnter={() => announce('Ir al Ranking')}
            >
              Ranking
            </Link>
          )}
          
          {/* Voice Mode Toggle - Mobile */}
          {isVoiceAvailable && (
            <button
              onClick={() => {
                const nextEnabled = !isVoiceModeEnabled
                toggleVoiceMode();
                setOpen(false);
                announce(nextEnabled ? 'Modo de voz activado' : 'Modo de voz desactivado')
                if (nextEnabled) {
                  announce('Menú: Inicio, Panel, Ranking e Iniciar sesión. Desliza o usa tab y enter para navegar.')
                }
              }}
              className={`block w-full text-left px-3 py-3 rounded-md text-base transition-colors ${
                isVoiceModeEnabled 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-600 text-white'
              }`}
              onFocus={() => announce('Alternar modo de voz')}
              onMouseEnter={() => announce('Alternar modo de voz')}
            >
              🎤 {isVoiceModeEnabled ? 'Voz ON' : 'Voz OFF'}
            </button>
          )}
          
          <Link
            to="/login"
            className="block bg-bb-primary px-3 py-3 rounded-md text-white text-base"
            onClick={() => setOpen(false)}
            onFocus={() => announce('Ir a Iniciar sesión')}
            onMouseEnter={() => announce('Ir a Iniciar sesión')}
          >
            Iniciar
          </Link>
        </div>
      </div>
    </header>
  )
}
