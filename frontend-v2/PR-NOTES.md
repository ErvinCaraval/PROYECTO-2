# PR: UI/UX mobile improvements, accessibility, tests & coverage

Resumen de cambios principales (no funcionales):
- UI/UX modernizada con Tailwind, componentes reutilizables (`Button`, `Input`, `Card`, `Alert`, `Section`, `Modal`, `Skeleton`, `Spinner`).
- Mejoras móviles: drawer en `Navbar`, `Modal` con bloqueo de scroll, overlays móviles con spinners.
- Flujo de preguntas: opciones más legibles, grid responsive, resaltado de correcta/incorrecta.
- Lobby y Dashboard con animaciones sutiles (framer-motion) y skeletons.
- Selector de cantidad para IA/Manual: campo vacío, solo numérico, teclado móvil, validación y ayuda.
- Socket más robusto: transporte WebSocket, timeouts y conexión única.
- Coverage 95% configurado; añadidas pruebas base (AIQuestionGenerator, Question, Navbar).

Notas:
- Este archivo se añade para abrir un PR histórico hacia `main` (los cambios principales ya están en `main`).