module.exports = {
  extends: ['../../.eslintrc.js'],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
    '@next/next/no-img-element': 'off',
    'react/jsx-key': 'off',
    'react/no-children-prop': 'off',
    // Import ordering is purely cosmetic and fights the new app-router file
    // layout; keep it off during the migration.
    'import/order': 'off',
    'react-hooks/exhaustive-deps': [
      'warn',
      {
        additionalHooks: 'useRecoilCallback|useRecoilTransaction_UNSTABLE',
      },
    ],
  },
}
