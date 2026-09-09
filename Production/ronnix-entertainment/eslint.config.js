/**
 * eslint.config.js — Lint-Gate (Flat Config, ESLint 9).
 *
 * `npm run lint` muss mit 0 Warnings bestehen (AGENTS.md §7). Basis:
 * JS-recommended + TypeScript-recommended. Zwei bewusste Altbestand-Ausnahmen
 * (mit Cluster-Plan für echten Fix statt Ignoranz):
 * - `varsIgnorePattern '^React$'`: `import React` ist unter `react-jsx`
 *   überflüssig, steht aber in ~30 Dateien — Cleanup beim Datei-Split (Cluster C).
 * - `allowEmptyCatch`: leere `catch {}` sind hier bewusstes Muster für
 *   Storage-Guards (localStorage/Private-Mode), kein Versehen.
 * - `no-explicit-any: off`: `any` ist Altbestand (~50 Stellen, v. a. Firestore-
 *   Payloads/Event-Handler) — schrittweise Typisierung in Cluster C, danach
 *   wieder anschalten. Besser ehrlich aus als 50 Husch-Typen.
 * - `set-state-in-effect` / `static-components` / `refs: off`: neue
 *   v6-Meinungsregeln, die ~30 bewusst gewachsene Muster melden (AuthSlot-
 *   Crossfade, Remote-Config-Init, Profil-Sync, Editor-Toolbar-Komponenten,
 *   Token-Ref). Echte Refactors in Cluster C/D (Datei-Splits, Motion-System),
 *   kein Schnell-Fix am Gate. `rules-of-hooks` + `exhaustive-deps` bleiben an.
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    name: 'ronnix/ignores',
    ignores: [
      'dist/**',
      'dist-ssg/**',
      'node_modules/**',
      'functions/node_modules/**',
      '.firebase/**',
      'public/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    name: 'ronnix/frontend',
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/refs': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^React$' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    name: 'ronnix/functions-backend',
    files: ['functions/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // CommonJS ist hier Pflicht (Functions-Runtime), kein ESM-Refactor.
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    name: 'ronnix/node-config',
    files: ['eslint.config.js', 'postcss.config.js', 'tailwind.config.js', 'scripts/**/*.mjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
