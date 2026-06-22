import { readdirSync, readFileSync } from 'fs';
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
 * Loads a YAML locale file and returns its flattened, sorted key set.
 *
 * @param {string} filePath - Absolute path to the YAML locale file.
 * @returns {string[]} the sorted list of dotted-path keys found in the file.
 */
function loadKeys(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const data = load(content);

  return flattenKeys(data).sort();
}

/**
 * Lists the absolute paths of every `*.yaml` file directly under the i18n directory.
 *
 * @returns {string[]} the absolute paths of the locale files.
 */
function listLocaleFiles() {
  return readdirSync(I18N_DIR)
    .filter((file) => file.endsWith('.yaml'))
    .map((file) => join(I18N_DIR, file));
}

/**
 * Prints the differences between a locale file's keys and the reference key set.
 *
 * @param {string} fileName - The locale file name being reported.
 * @param {string[]} keys - The keys found in the locale file.
 * @param {string[]} referenceKeys - The reference key set to compare against.
 * @returns {boolean} true when the file's keys differ from the reference, false otherwise.
 */
function reportDifferences(fileName, keys, referenceKeys) {
  const keySet = new Set(keys);
  const referenceSet = new Set(referenceKeys);
  const missing = referenceKeys.filter((key) => !keySet.has(key));
  const extra = keys.filter((key) => !referenceSet.has(key));

  if (missing.length === 0 && extra.length === 0) {
    return false;
  }

  console.error(`Translation key mismatch in ${fileName}:`);
  if (missing.length > 0) {
    console.error(`  Missing keys: ${missing.join(', ')}`);
  }
  if (extra.length > 0) {
    console.error(`  Extra keys: ${extra.join(', ')}`);
  }

  return true;
}

/**
 * Checks that every locale file under `assets/i18n/` shares the same set of
 * dotted-path translation keys, printing details and exiting with a non-zero
 * status when a mismatch is found.
 *
 * @returns {void}
 */
function checkI18n() {
  const filePaths = listLocaleFiles();

  if (filePaths.length === 0) {
    console.error(`No locale files found in ${I18N_DIR}`);
    process.exit(1);
  }

  const [referencePath, ...otherPaths] = filePaths;
  const referenceKeys = loadKeys(referencePath);

  const hasMismatch = otherPaths.reduce((mismatchFound, filePath) => {
    const keys = loadKeys(filePath);
    const differs = reportDifferences(filePath, keys, referenceKeys);

    return mismatchFound || differs;
  }, false);

  if (hasMismatch) {
    process.exit(1);
  }

  console.log(`All ${filePaths.length} locale files share the same translation keys.`);
}

checkI18n();
