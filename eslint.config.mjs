import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

const globals = Object.fromEntries(
  [
    'console',
    'process',
    'Buffer',
    'URL',
    'document',
    'window',
    'performance',
    'setTimeout',
    'clearTimeout',
    'DOMPoint',
    'fetch',
  ].map((name) => [name, 'readonly']),
);
export default [
  { ignores: ['node_modules/**', '.recovery/**', 'registry/**', 'packages/*/dist/**'] },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-unreachable': 'error',
      'valid-typeof': 'error',
      eqeqeq: 'error',
    },
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['tests/browser/**/*.mjs'],
    languageOptions: {
      globals: Object.fromEntries(
        [
          'lights',
          'requestAnimationFrame',
          'dispatchEvent',
          'Event',
          'MutationObserver',
          'SVGElement',
          'innerHeight',
        ].map((name) => [name, 'readonly']),
      ),
    },
  },
  {
    files: ['**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
];
