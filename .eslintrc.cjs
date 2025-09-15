// Load custom rule implementations
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
  plugins: ['react', 'react-hooks', 'internal', '@typescript-eslint'],
  // Custom rules registration (map namespace to implementation)
  rules: {
  'internal/no-prop-types-disable': 'error',
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
    // Forbid window fallback patterns like `window.Foo || ...`, `if (window.Foo)`, `window?.Foo ?? ...`
    'no-restricted-syntax': [
      'error',
      {
        selector:
          "LogicalExpression[operator=/^(\\|\\||\\?\\?)$/][left.type='MemberExpression'][left.object.name='window']",
        message:
          'Avoid window fallbacks (window.* on the left of ||/??). Use the registry (getComponent/registerComponent) or imports.',
      },
      {
        selector:
          "LogicalExpression[operator=/^(\\|\\||\\?\\?)$/] > ChainExpression.left MemberExpression[object.name='window']",
        message:
          'Avoid window fallbacks (window.* on the left of ||/??). Use the registry (getComponent/registerComponent) or imports.',
      },
      {
        selector:
          "IfStatement[test.type='MemberExpression'][test.object.name='window']",
        message:
          'Avoid guarding with window.* in if conditions. Use capability detection via registry or dependency injection.',
      },
      {
        selector:
          'IfStatement > ChainExpression[test] MemberExpression[object.name="window"]',
        message:
          'Avoid guarding with window?.* in if conditions. Use registry or dependency injection.',
      },
      {
        selector:
          "ConditionalExpression[test.type='MemberExpression'][test.object.name='window']",
        message:
          'Avoid conditional expressions that guard on window.*. Use registry or dependency injection.',
      },
      {
        selector:
          'ConditionalExpression > ChainExpression[test] MemberExpression[object.name="window"]',
        message:
          'Avoid conditional expressions that guard on window?.*. Use registry or dependency injection.',
      },
    ],
  },
  settings: { react: { version: 'detect' } },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      extends: [
        'plugin:@typescript-eslint/recommended'
      ],
      rules: {
        // Allow explicit any during incremental migration; tighten later.
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off'
      }
    }
  ],
  globals: {
    React: 'readonly',
    ReactDOM: 'readonly',
    _: 'readonly',
    window: 'writable',
  },
};
