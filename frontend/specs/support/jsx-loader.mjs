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
 * Load hook for the Node.js module loader.
 * Transforms JSX files to plain JavaScript.
 *
 * @param {string} url - The module URL.
 * @param {object} context - The load context.
 * @param {Function} nextLoad - The next load function.
 * @returns {Promise<object>} The loaded and transformed module source.
 */
export async function load(url, context, nextLoad) {
  if (url.endsWith('?raw')) {
    const filePath = fileURLToPath(url.slice(0, -'?raw'.length));
    const source = readFileSync(filePath, 'utf-8');
    return {
      format: 'module',
      source: `export default ${JSON.stringify(source)};`,
      shortCircuit: true,
    };
  }
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
  if (url.endsWith('.css') || url.endsWith('.scss')) {
    // Frontend entrypoints import stylesheets, but Node-based specs only need the JS module graph.
    return {
      format: 'module',
      source: 'export default {};',
      shortCircuit: true,
    };
  }
  if (url.includes('/bootstrap/dist/js/')) {
    // Bootstrap JS bundle requires a browser DOM; stub it out for Node-based specs.
    return {
      format: 'module',
      source: 'export default {};',
      shortCircuit: true,
    };
  }
  if (url.startsWith('stub:image:')) {
    // Static image imports are resolved by Vite at build time; return a fixed filename stub for specs.
    const filename = url.slice('stub:image:'.length);
    return {
      format: 'module',
      source: `export default '${filename}';`,
      shortCircuit: true,
    };
  }
  const [bareUrl] = url.split('?');
  if (bareUrl.endsWith('.js') && !bareUrl.includes('/node_modules/')) {
    const filePath = fileURLToPath(bareUrl);
    const source = readFileSync(filePath, 'utf-8');
    if (source.includes('import.meta.env')) {
      // Vite statically replaces `import.meta.env.VITE_*` at build/dev time; plain Node never
      // populates `import.meta.env`, so shim it from `process.env` before the module's own code runs.
      return {
        format: 'module',
        source: `import.meta.env = import.meta.env ?? { ...process.env };\n${source}`,
        shortCircuit: true,
      };
    }
  }
  return nextLoad(url, context);
}
