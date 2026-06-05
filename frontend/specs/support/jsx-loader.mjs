/**
 * Node.js loader for Jasmine tests.
 * Transforms JSX modules with Babel and stubs CSS imports.
 */

import { transformSync } from '@babel/core';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

/**
 * Resolve hook for the Node.js module loader.
 *
 * @param {string} specifier - The module specifier.
 * @param {object} context - The resolution context.
 * @param {Function} nextResolve - The next resolve function.
 * @returns {Promise<object>} The resolved module.
 */
export async function resolve(specifier, context, nextResolve) {
  return nextResolve(specifier, context);
}

/**
 * Load hook for the Node.js module loader.
 * Transforms JSX files to plain JavaScript.
 *
 * @param {string} url - The module URL.
 * @param {object} context - The load context.
 * @param {Function} nextLoad - The next load function.
 * @returns {Promise<object>} The loaded and transformed module source.
 */
export async function load(url, context, nextLoad) {
  if (url.endsWith('.jsx')) {
    const filePath = fileURLToPath(url);
    const source = readFileSync(filePath, 'utf-8');
    const transformed = transformSync(source, {
      filename: filePath,
      presets: [
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
      sourceType: 'module',
    });
    return {
      format: 'module',
      source: transformed.code,
      shortCircuit: true,
    };
  }
  if (url.endsWith('.css')) {
    // Frontend entrypoints import stylesheets, but Node-based specs only need the JS module graph.
    return {
      format: 'module',
      source: 'export default {};',
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
