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
    // Removed unsupported 'env' and 'parseOptions' keys for flat config compatibility.
    // Node.js globals are already provided via 'globals' above, and Jest globals are not needed for linting.

  },
];
