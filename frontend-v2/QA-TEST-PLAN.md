## Coverage

Target: 95% statements, functions and lines; 90% branches. Configured in `vitest.config.js` using v8 provider. Reporters: text, html, lcov.


# Plan de Pruebas (QA) para brainblitz-frontend

Fecha: 2025-09-26

Resumen ejecutivo
------------------
Este documento describe un plan de pruebas completo (manual y automático) para el frontend construido con Vite + React en este repositorio. Cubre pruebas funcionales, UI/UX, rendimiento, accesibilidad (a11y), regresión, E2E, pruebas visuales y procedimientos operativos para ejecutar las pruebas localmente y en CI.

Vistas cubiertas
-----------------
Basado en `src/pages` las vistas a cubrir son:

- HomePage
- LoginPage
- RegisterPage
- PasswordResetPage
- CompleteProfilePage
- ProfilePage
- DashboardPage
- GameLobbyPage
- GamePage
- GameSummaryPage
- AdminPage

Contrato (breve)
-----------------
- Inputs: código fuente, variables de entorno para staging, credenciales de prueba.
- Outputs: casos de prueba manuales y automáticos, scripts y comandos, reportes (Playwright), informe de accesibilidad, QA checklist.
- Criterios de éxito: tests unitarios y E2E para flujos críticos ejecutables, pruebas a11y y visuales integradas y reproducibles en CI.

1) Pruebas funcionales
----------------------
Objetivo: Verificar navegación, rutas, formularios, CRUD (si aplica) y llamadas a APIs.

Por vista (plantilla): título, pasos, datos de prueba, resultado esperado.

- HomePage: enlaces y CTA, carga de componentes.
- LoginPage: validaciones (email/password), redirecciones, persistencia de sesión.
- RegisterPage: validaciones, error email duplicado, redirect a profile/dashboard.
- PasswordResetPage: envío de email, token inválido.
- CompleteProfilePage: subir avatar, validar tamaños y formatos.
- ProfilePage: ver/editar perfil, permisos.
- DashboardPage: listados, filtros, paginación.
- GameLobbyPage: crear/unirse a sala, lista de jugadores, roles.
- GamePage: temporizador, envío de respuestas, sockets (reconexión).
- GameSummaryPage: resultados, exportar/compartir.
- AdminPage: CRUD de recursos.

Automatización recomendada:
- Unit tests: Jest o Vitest + React Testing Library.
- E2E: Playwright (recomendado) o Cypress para flujos completos.

2) Pruebas UI/UX
----------------
Checklist por vista:
- Responsive: anchos 320px, 768px, 1024-1440px.
- Consistencia visual: tipografías, colores, espaciado.
- Interacciones: hover/focus/active, transiciones.
- Touch: objetivos táctiles >=48px.
- Cross-browser: Chrome, Firefox, Safari, Edge.

Herramientas: Browser devtools, BrowserStack (opcional), Storybook (si aplica).

3) Pruebas de rendimiento
-------------------------
Métricas: FCP, LCP, TTI, TBT, CLS. Herramientas: Lighthouse, WebPageTest, bundle analyzer.
Procedimientos: medir cold/cached, simular redes lentas (3G), CPU throttling.

4) Pruebas de accesibilidad (a11y)
---------------------------------
Checklist:
- Contraste (>=4.5:1), etiquetas y roles ARIA, navegación por teclado, skip links, anuncios de estado (live regions).
Herramientas: axe-core, axe-playwright, cypress-axe, VoiceOver/NVDA.

5) Pruebas de regresión
------------------------
Estrategia: mantener suite E2E para flujos críticos y ejecutar en cada PR. Visual regression para detectar cambios no deseados.

6) Pruebas E2E
--------------
Flujos recomendados:
- Registro completo → completar perfil.
- Login → Dashboard → Crear sala → Jugar → Summary.
- Recuperación de contraseña.
- Admin CRUD.

Mocks: para estabilidad, mockear APIs o usar staging.

7) Pruebas visuales
--------------------
Herramientas: Playwright snapshots, Percy, Loki. Capturas por viewport y estados (loading, empty, populated).

8) Checklist final de QA
------------------------
Preparación:
- Variables de entorno (`.env.local`), credenciales de prueba.
- `npm install`

Comandos principales (añadir a `package.json`):
- `npm run test:unit` — tests unitarios (Vitest).
- `npm run test:e2e` — Playwright E2E.
- `npm run test:a11y` — Playwright a11y job.
- `npm run test:visual` — Playwright visual snapshots.

9) Entrega y manual de ejecución
--------------------------------
Procedimientos:
A) Localmente
1. npm install
2. npx playwright install (descarga navegadores)
3. npm run test:unit
4. npm run test:e2e
5. npm run test:a11y

B) En CI (GitHub Actions)
- Configurar workflow para ejecutar: npm ci, npx playwright install --with-deps, npm run test:unit, npm run test:e2e

10) Adjuntos y artefactos
-------------------------
- Reportes Playwright en `playwright-report/`.
- Violaciones a11y adjuntas en la ejecución de Playwright.

Notas finales
------------
Este plan es una base completa; puedo generar los tests adicionales y el workflow CI automáticamente si lo deseas. Para ejecutar E2E en tu máquina, asegúrate de que `npx playwright install` descargue navegadores y, si hace falta, instala dependencias del SO con `npx playwright install-deps`.
