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
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'warn',
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    // Restrict legacy window.React usage to encourage modernization
    'no-restricted-properties': [
      'error',
      {
        object: 'window',
        property: 'React',
        message: 'Use direct React imports instead of window.React. See MIGRATION_GUIDE.md for patterns.',
      },
    ],
    // Warn about dynamic Tailwind class construction
    'no-template-literals-in-class-names': 'off', // Custom rule would go here
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  globals: {
    React: 'readonly',
    ReactDOM: 'readonly',
    _: 'readonly',
    window: 'writable',
  },
};
