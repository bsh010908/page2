// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'

export default [
  {
    files: ['**/*.js'],
    ignores: ['dist', 'node_modules'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.browser,
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'warn',
    },
  },
]
