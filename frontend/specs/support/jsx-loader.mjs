/**
 * Node.js loader for Jasmine tests.
 * Transforms JSX modules with Babel, stubs CSS imports, and shims
 * `import.meta.env` (which Vite populates at build/dev time, but plain
 * Node never does) from `process.env` for modules that read it.
 */

import { transformSync } from '@babel/core';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

/**
 * Resolve hook for the Node.js module loader.
 *
 * @param {string} specifier - The module specifier.
 * @param {object} context - The resolution context.
 * @param {Function} nextResolve - The next resolve function.
 * @returns {Promise<object>} The resolved module.
 */
export async function resolve(specifier, context, nextResolve) {
  if (IMAGE_EXTENSIONS.some((ext) => specifier.endsWith(ext))) {
    // Return a synthetic URL so the load hook can intercept it without Node trying to find the file.
    return { url: `stub:image:${specifier.split('/').pop()}`, shortCircuit: true };
  }
  if (specifier.endsWith('?raw')) {
    // Vite resolves `?raw` imports to the file's text contents; replicate that for Node-based specs.
    const resolved = await nextResolve(specifier.slice(0, -'?raw'.length), context);
    return { ...resolved, url: `${resolved.url}?raw`, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

/**
 * Handles `?raw` text imports by returning the file's raw contents as a default export.
 *
 * @param {string} url - The module URL.
 * @returns {object|undefined} The load result, or undefined if the URL doesn't match.
 */
function handleRawImport(url) {
  if (!url.endsWith('?raw')) {
    return undefined;
  }
  const filePath = fileURLToPath(url.slice(0, -'?raw'.length));
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- filePath comes from Node's own ESM loader url, driven only by import specifiers in this repo's own source/spec files; this loader is registered for local Jasmine runs only, never in production.
  const source = readFileSync(filePath, 'utf-8');
  return {
    format: 'module',
    source: `export default ${JSON.stringify(source)};`,
    shortCircuit: true,
  };
}

/**
 * Transforms `.jsx` files to plain JavaScript via Babel.
 *
 * @param {string} url - The module URL.
 * @returns {object|undefined} The load result, or undefined if the URL doesn't match.
 */
function handleJsxTransform(url) {
  if (!url.endsWith('.jsx')) {
    return undefined;
  }
  const filePath = fileURLToPath(url);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- filePath comes from Node's own ESM loader url, driven only by import specifiers in this repo's own source/spec files; this loader is registered for local Jasmine runs only, never in production.
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

/**
 * Stubs `.css`/`.scss` imports, which Node-based specs don't need.
 *
 * @param {string} url - The module URL.
 * @returns {object|undefined} The load result, or undefined if the URL doesn't match.
 */
function handleStyleStub(url) {
  if (!url.endsWith('.css') && !url.endsWith('.scss')) {
    return undefined;
  }
  return {
    format: 'module',
    source: 'export default {};',
    shortCircuit: true,
  };
}

/**
 * Stubs the Bootstrap JS bundle, which requires a browser DOM.
 *
 * @param {string} url - The module URL.
 * @returns {object|undefined} The load result, or undefined if the URL doesn't match.
 */
function handleBootstrapStub(url) {
  if (!url.includes('/bootstrap/dist/js/')) {
    return undefined;
  }
  return {
    format: 'module',
    source: 'export default {};',
    shortCircuit: true,
  };
}

/**
 * Stubs static image imports resolved by Vite at build time.
 *
 * @param {string} url - The module URL.
 * @returns {object|undefined} The load result, or undefined if the URL doesn't match.
 */
function handleImageStub(url) {
  if (!url.startsWith('stub:image:')) {
    return undefined;
  }
  const filename = url.slice('stub:image:'.length);
  return {
    format: 'module',
    source: `export default '${filename}';`,
    shortCircuit: true,
  };
}

/**
 * Shims `import.meta.env` from `process.env` for modules that read it, since plain Node
 * never populates it the way Vite does at build/dev time.
 *
 * @param {string} url - The module URL.
 * @returns {object|undefined} The load result, or undefined if the URL doesn't match.
 */
function handleViteEnvShim(url) {
  const [bareUrl] = url.split('?');
  if (!bareUrl.endsWith('.js') || bareUrl.includes('/node_modules/')) {
    return undefined;
  }
  const filePath = fileURLToPath(bareUrl);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- filePath comes from Node's own ESM loader url, driven only by import specifiers in this repo's own source/spec files; this loader is registered for local Jasmine runs only, never in production.
  const source = readFileSync(filePath, 'utf-8');
  if (!source.includes('import.meta.env')) {
    return undefined;
  }
  return {
    format: 'module',
    source: `import.meta.env = import.meta.env ?? { ...process.env };\n${source}`,
    shortCircuit: true,
  };
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
  return (
    handleRawImport(url) ??
    handleJsxTransform(url) ??
    handleStyleStub(url) ??
    handleBootstrapStub(url) ??
    handleImageStub(url) ??
    handleViteEnvShim(url) ??
    nextLoad(url, context)
  );
}
