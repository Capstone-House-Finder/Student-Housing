export const env = {
  jest: true,
  es2022: true,
  node: true,
};
export const extendsConfig = [
  'eslint:recommended',
];
export const parserOptions = {
  ecmaVersion: 2022,
  sourceType: 'module',
};
export const rules = {
  // Add your custom rules here
  'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
};