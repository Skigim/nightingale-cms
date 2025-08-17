module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks'],
  rules: {
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react/prop-types': 'warn',
    'no-unused-vars': 'warn',
    'no-console': 'off', // Allow console for debugging
    'prefer-const': 'error',
    'no-var': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  globals: {
    React: 'readonly',
    ReactDOM: 'readonly',
    dayjs: 'readonly',
    _: 'readonly', // Lodash
    Fuse: 'readonly',
    // Nightingale globals
    window: 'writable',
    NightingaleFileService: 'readonly',
    NightingaleUtils: 'readonly',
    NightingaleSearch: 'readonly',
    NightingaleParsers: 'readonly',
  },
};
