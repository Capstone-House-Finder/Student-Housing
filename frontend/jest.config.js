// Jest configuration for the frontend project
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  // Transform TypeScript files using ts-jest
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Adjust paths if using absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Setup testing-library matchers
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Ignore CSS and other static imports
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
};
