module.exports = {
  env: {
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // Add your custom rules here
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
};