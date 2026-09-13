import js from '@eslint/js';
import complexity from 'eslint-plugin-complexity';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jasmine from 'eslint-plugin-jasmine';
import jsdoc from 'eslint-plugin-jsdoc';
import security from 'eslint-plugin-security';
import securityNode from 'eslint-plugin-security-node';
import noUnsanitized from 'eslint-plugin-no-unsanitized';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**/*.js', 'dist/**/*.js', 'report/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs}'],
    plugins: {
      complexity,
      react,
      'react-hooks': reactHooks,
      jsdoc,
      security,
      'security-node': securityNode,
      'no-unsanitized': noUnsanitized,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node, ...globals.es2021 },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      complexity: ['warn', { max: 10 }],
      'max-lines': ['warn', { max: 300 }],
      'max-depth': ['warn', { max: 4 }],
      indent: ['error', 2, { SwitchCase: 1 }],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-empty-function': 'error',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'jsdoc/require-jsdoc': ['error', {
        require: { ClassDeclaration: true, MethodDefinition: true, FunctionDeclaration: true },
        publicOnly: true,
      }],
      'jsdoc/require-param': 'error',
      'jsdoc/require-param-description': 'error',
      'jsdoc/require-returns': 'error',
      'jsdoc/require-returns-description': 'error',
      'jsdoc/require-description': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security-node/non-literal-reg-expr': 'error',
      'security/detect-possible-timing-attacks': 'error',
      'security-node/detect-possible-timing-attacks': 'error',
      'no-unsanitized/method': 'error',
      'no-unsanitized/property': 'error',
    },
  },
  {
    // Test files: relax JSDoc rules and enable Jasmine globals
    files: ['specs/**/*.{js,jsx,mjs}'],
    plugins: { jasmine },
    languageOptions: { globals: { ...globals.jasmine } },
    rules: {
      'jasmine/no-focused-tests': 'error',
      'jasmine/no-disabled-tests': 'warn',
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/require-description': 'off',
    },
  },
  {
    // This project's own eslint-plugin-security-node version does not enable
    // (and, per an upstream bug, cannot even run) `detect-unhandled-async-errors`
    // here, but Codacy's independent security scan flags this file's
    // intentionally empty `catch` under that rule. Keep the justified
    // eslint-disable comment for Codacy without ESLint auto-removing it here
    // as an "unused directive".
    files: ['specs/support/flushMicrotasks.js'],
    linterOptions: { reportUnusedDisableDirectives: 'off' },
  },
];
