module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  globals: {
    DocumentTouch: 'readonly',
    MSApp: 'readonly',
    global: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  extends: ['eslint:recommended', 'prettier'],
  rules: {
    'no-prototype-builtins': 'off',
    'no-empty': 'off',
    'no-unused-vars': 'off',
  },
}
