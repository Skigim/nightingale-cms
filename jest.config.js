module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/tests/**/*.{js,jsx}',
    '<rootDir>/tests/**/*.(test|spec).{js,jsx}',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/setupTests.js',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'jsx', 'json'],
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/docs/'],
  globals: {
    window: {
      React: 'react',
      ReactDOM: 'react-dom',
    },
  },
};
