import js from '@eslint/js';

export default [
  {
    ignores: ['node_modules/', 'dist/', 'build/', '.eslintrc.js'],
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
    env: {
      node: true,
      jest: true,
    },
    parseOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },
];
