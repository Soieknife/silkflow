const path = require('path')

module.exports = {
  root: true,
  env: {
    node: true,
  },
  ignorePatterns: [
    'node_modules/',
    '**/.next/',
    '**/next-env.d.ts',
    '**/dist/',
    '**/build/',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'next',
  ],
  settings: {
    next: {
      rootDir: path.join(__dirname, 'apps/reader'),
    },
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_',
        caughtErrors: 'none',
      },
    ],
    '@typescript-eslint/no-unused-expressions': [
      'error',
      { allowShortCircuit: true, allowTernary: true },
    ],
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'import/no-anonymous-default-export': 'off',
    'no-empty': 'off',
    'import/order': [
      'error',
      {
        alphabetize: { order: 'asc' },
        'newlines-between': 'always',
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        pathGroups: [{ pattern: '@silkflow/**', group: 'internal' }],
        pathGroupsExcludedImportTypes: ['builtin'],
      },
    ],
  },
}
