module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
  },
  plugins: ['prettier'],
  rules: {
    semi: ['error', 'always'],
    'no-var': 1,
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
    'import/order': [
      'error',
      {
        'newlines-between': 'always-and-inside-groups',
        groups: [['builtin', 'external']],
      },
    ],
  },
};
