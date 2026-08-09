import { readdirSync, readFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { load } from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const I18N_DIR = join(__dirname, '..', 'assets', 'i18n');

/**
 * Flattens a nested object into dotted-path keys.
 *
 * @param {object} object - The nested object to flatten.
 * @param {string} [prefix] - The dotted-path prefix accumulated so far.
 * @returns {string[]} the list of dotted-path keys found in the object.
 */
function flattenKeys(object, prefix = '') {
  return Object.entries(object).reduce((keys, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return keys.concat(flattenKeys(value, path));
    }

    return keys.concat(path);
  }, []);
}

/**
 * Lists the language directories directly under the i18n directory.
 *
 * @returns {string[]} the language codes (directory names) found.
 */
function listLanguageDirs() {
  return readdirSync(I18N_DIR).filter((entry) => statSync(join(I18N_DIR, entry)).isDirectory());
}

/**
 * Lists the absolute paths of every `*.yaml` chunk file directly under a
 * language directory (skipping `index.js` and any other non-YAML file).
 *
 * @param {string} language - The language code (directory name).
 * @returns {string[]} the absolute paths of the language's chunk files.
 */
function listChunkFiles(language) {
  const dir = join(I18N_DIR, language);

  return readdirSync(dir)
    .filter((file) => file.endsWith('.yaml'))
    .map((file) => join(dir, file));
}

/**
 * Reads and merges every YAML chunk file of a language into a single
 * namespace map, tracking which file each top-level namespace key came
 * from so duplicate namespaces across files can be detected.
 *
 * @param {string} language - The language code (directory name).
 * @returns {{merged: object, namespaceFiles: Map<string, string>, duplicates: string[]}}
 *   the merged namespace map, a map of namespace key to the (base) file name
 *   it was found in, and the list of duplicate-namespace error messages found.
 */
function loadLanguage(language) {
  const chunkPaths = listChunkFiles(language);
  const merged = {};
  const namespaceFiles = new Map();
  const duplicates = [];

  chunkPaths.forEach((filePath) => {
    const fileName = filePath.split('/').pop();
    const content = readFileSync(filePath, 'utf8');
    const data = load(content) ?? {};

    Object.keys(data).forEach((namespace) => {
      if (namespaceFiles.has(namespace)) {
        duplicates.push(
          `Namespace '${namespace}' is defined in both ${namespaceFiles.get(namespace)} and ${fileName} for language '${language}'.`
        );
        return;
      }

      namespaceFiles.set(namespace, fileName);
      merged[namespace] = data[namespace];
    });
  });

  return { merged, namespaceFiles, duplicates };
}

/**
 * Prints the differences between a language's keys and the reference key set.
 *
 * @param {string} language - The language code being reported.
 * @param {string[]} keys - The keys found for the language.
 * @param {string[]} referenceKeys - The reference key set to compare against.
 * @returns {boolean} true when the language's keys differ from the reference, false otherwise.
 */
function reportDifferences(language, keys, referenceKeys) {
  const keySet = new Set(keys);
  const referenceSet = new Set(referenceKeys);
  const missing = referenceKeys.filter((key) => !keySet.has(key));
  const extra = keys.filter((key) => !referenceSet.has(key));

  if (missing.length === 0 && extra.length === 0) {
    return false;
  }

  console.error(`Translation key mismatch in language '${language}':`);
  if (missing.length > 0) {
    console.error(`  Missing keys: ${missing.join(', ')}`);
  }
  if (extra.length > 0) {
    console.error(`  Extra keys: ${extra.join(', ')}`);
  }

  return true;
}

/**
 * Prints the differences between a language's namespace-to-file mapping and
 * the reference mapping — namespaces living under a different file name than
 * in the reference language, or missing entirely for this language.
 *
 * @param {string} language - The language code being reported.
 * @param {Map<string, string>} namespaceFiles - Map of namespace to file name for this language.
 * @param {Map<string, string>} referenceNamespaceFiles - Reference map of namespace to file name.
 * @returns {boolean} true when a mismatch was found, false otherwise.
 */
function reportFileMappingDifferences(language, namespaceFiles, referenceNamespaceFiles) {
  let hasMismatch = false;

  referenceNamespaceFiles.forEach((referenceFileName, namespace) => {
    const fileName = namespaceFiles.get(namespace);

    if (fileName === undefined) {
      console.error(
        `Namespace '${namespace}' has no file for language '${language}' (expected a file mirroring '${referenceFileName}').`
      );
      hasMismatch = true;
      return;
    }

    if (fileName !== referenceFileName) {
      console.error(
        `Namespace '${namespace}' lives in '${fileName}' for language '${language}' but in '${referenceFileName}' for the reference language — file placement must match across languages.`
      );
      hasMismatch = true;
    }
  });

  namespaceFiles.forEach((fileName, namespace) => {
    if (!referenceNamespaceFiles.has(namespace)) {
      console.error(
        `Namespace '${namespace}' (in '${fileName}') exists for language '${language}' but not for the reference language.`
      );
      hasMismatch = true;
    }
  });

  return hasMismatch;
}

/**
 * Checks that every language directory under `assets/i18n/` shares the same
 * set of dotted-path translation keys and the same namespace-to-file
 * mapping, printing details and exiting with a non-zero status when a
 * mismatch or a duplicate namespace is found.
 *
 * @returns {void}
 */
function checkI18n() {
  const languages = listLanguageDirs();

  if (languages.length === 0) {
    console.error(`No language directories found in ${I18N_DIR}`);
    process.exit(1);
  }

  const loaded = languages.map((language) => ({ language, ...loadLanguage(language) }));

  const hasDuplicates = loaded.reduce((found, { duplicates }) => {
    duplicates.forEach((message) => console.error(message));
    return found || duplicates.length > 0;
  }, false);

  const [reference, ...others] = loaded;
  const referenceKeys = flattenKeys(reference.merged).sort();

  const hasKeyMismatch = others.reduce((mismatchFound, { language, merged }) => {
    const keys = flattenKeys(merged).sort();
    const differs = reportDifferences(language, keys, referenceKeys);

    return mismatchFound || differs;
  }, false);

  const hasMappingMismatch = others.reduce((mismatchFound, { language, namespaceFiles }) => {
    const differs = reportFileMappingDifferences(language, namespaceFiles, reference.namespaceFiles);

    return mismatchFound || differs;
  }, false);

  if (hasDuplicates || hasKeyMismatch || hasMappingMismatch) {
    process.exit(1);
  }

  console.log(`All ${languages.length} language directories share the same translation keys and file layout.`);
}

checkI18n();
