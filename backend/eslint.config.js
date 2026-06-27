import js from '@eslint/js';

/** Node 18+ global APIs available in ESM modules */
const nodeFetchGlobals = {
  fetch: 'readonly',
  FormData: 'readonly',
  Headers: 'readonly',
  Request: 'readonly',
  Response: 'readonly',
};

/** Jest test globals */
const jestGlobals = {
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  jest: 'readonly',
};

export default [
  {
    ignores: ['node_modules/', 'dist/', 'build/', '.eslintrc.js'],
  },
  // ── Production source ──────────────────────────────────────────────────
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        ...nodeFetchGlobals,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // ── Test files (src and tests/) ────────────────────────────────────────
  {
    files: ['src/**/*.test.js', 'tests/**/*.test.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        ...nodeFetchGlobals,
        ...jestGlobals,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Files that import Jest APIs from '@jest/globals' trigger no-redeclare
      // because the globals are also declared in languageOptions — safe to disable.
      'no-redeclare': 'off',
    },
  },
];
