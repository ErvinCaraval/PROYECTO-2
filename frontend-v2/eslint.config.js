import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import vitest from 'eslint-plugin-vitest'

export default [
  { ignores: ['dist'] },

  // Configuración principal para archivos JS y JSX
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.2' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': [
        'warn',
        { vars: 'all', args: 'after-used', ignoreRestSiblings: true, varsIgnorePattern: '^React$' }
      ],
      'react/prop-types': 'off',
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },

  // Configuración para la carpeta de scripts
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { process: true },
      parserOptions: { sourceType: 'module' },
    },
    rules: {
      'no-undef': ['error', { typeof: true }],
    },
  },

  // ====================================================================
  // ||  EL CAMBIO CLAVE ESTÁ AQUÍ                                     ||
  // ====================================================================
  // Bloque específico para el archivo de setup de pruebas.
  // Esto soluciona los errores de 'global' no definido.
  {
    files: ['src/setupTests.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  // ====================================================================

  // Bloque de configuración para los archivos de prueba de Vitest
  {
    files: ['src/**/*.test.{js,jsx}'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...vitest.environments.env.globals,
      },
    },
  },
]