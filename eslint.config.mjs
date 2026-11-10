import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const SERVER_BOUNDARY = {
  group: ['@/server/*', '@/server/**'],
  message: 'The client knows only the /iq contract, never the gateway.',
}

const VALIDATION_BOUNDARY = {
  group: ['zod', 'zod/*'],
  message:
    'Validation runs at the gateway. The client uses the contract types.',
}

const FEATURE_BOUNDARY = {
  group: ['@/features/*/**'],
  message: 'Import a feature through its index.ts.',
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),

  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'func-style': ['error', 'expression'],
      'react/jsx-sort-props': ['warn', { reservedFirst: true }],
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          pathGroups: [{ pattern: '@/**', group: 'internal' }],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'always',
        },
      ],
    },
  },

  {
    files: ['src/features/**/*.{ts,tsx}', 'src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [SERVER_BOUNDARY, FEATURE_BOUNDARY, VALIDATION_BOUNDARY] },
      ],
    },
  },
])

export default eslintConfig
