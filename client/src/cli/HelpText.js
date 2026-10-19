import { CommandRegistry } from './CommandRegistry.js';
import { ExitCodes } from './ExitCodes.js';

/**
 * Body placeholder used in the usage lines.
 * @type {string}
 */
const DATA = '--data <json|@file|->';

/**
 * One-line description of each action.
 * @type {Object<string, string>}
 */
const ACTIONS = Object.freeze({
  list: 'One page (JSON array); --meta adds the page metadata, --all streams NDJSON',
  mine: 'The games the token\'s user takes part in',
  get: 'One record',
  create: 'Creates a record from a JSON object body',
  update: 'Partially updates a record from a JSON object body',
});

/**
 * The global flags and their meaning.
 * @type {Array<[string, string]>}
 */
const FLAGS = Object.freeze([
  ['--url <url>', 'Overrides MAJORA_URL'],
  ['--token-file <path>', 'Reads the token from a file (trimmed); overrides MAJORA_TOKEN'],
  ['--allow-insecure-http', 'Allows http:// for any host'],
  ['--game <slug>', 'The game for game-scoped resources (falls back to MAJORA_GAME)'],
  ['--restricted', 'Uses the restricted variant (all.json / full.json)'],
  ['--page <n>, --per-page <n>', 'One page of a list'],
  ['--all', 'Streams every page as NDJSON (not with --page)'],
  ['--meta', 'list prints { data, page, pages, perPage, total }'],
  ['--query <key>=<value>', 'A list filter; repeatable'],
  [DATA, 'The create / update body: inline JSON, a file or stdin'],
  ['--timeout <ms>, --retries <n>', 'Passed through to the library'],
  ['--debug', 'Prints stack traces on error'],
  ['--help, --version', 'Prints this help (also: majora <resource> --help) or the version'],
]);

/**
 * The environment variables read by the CLI.
 * @type {Array<[string, string]>}
 */
const ENVIRONMENT = Object.freeze([
  ['MAJORA_URL', 'The API root, e.g. https://majora.example.com'],
  ['MAJORA_TOKEN', 'The scoped API token (mjr_...); there is no --token flag'],
  ['MAJORA_GAME', 'The default game for game-scoped resources'],
]);

/**
 * Formats rows as two aligned columns.
 * @param {Array<[string|number, string]>} rows - The rows.
 * @returns {string[]} The indented lines.
 */
function columns(rows) {
  const width = Math.max(...rows.map(([left]) => String(left).length));

  return rows.map(([left, right]) => `  ${String(left).padEnd(width)}  ${right}`);
}

/**
 * The usage of one action, e.g. `update <id> --data <json|@file|->`.
 * @param {string} resource - The resource name.
 * @param {string} action - The action name.
 * @returns {string} The usage.
 */
function actionUsage(resource, action) {
  const parts = [action];

  if (CommandRegistry.needsId(action)) {
    parts.push(resource === 'games' ? '<slug>' : '<id>');
  }
  if (CommandRegistry.takesBody(action)) {
    parts.push(DATA);
  }

  return parts.join(' ');
}

/**
 * Generates the help texts from `CommandRegistry`. They never include the token or any
 * environment value, only variable names.
 */
export class HelpText {
  /**
   * The `majora --help` text.
   * @returns {string} The help, ending with a newline.
   */
  static global() {
    const resources = CommandRegistry.resourceNames().map((name) => {
      const { actions, gameScoped } = CommandRegistry.resource(name);

      return [name, `${actions.join(', ')}${gameScoped ? ' (needs --game)' : ''}`];
    });

    return [
      'Usage: majora <resource> <action> [<id>] [flags]',
      '',
      'Calls the Majora API with a scoped token and prints JSON.',
      '',
      'Resources:',
      ...columns(resources),
      '',
      'Flags:',
      ...columns(FLAGS),
      '',
      'Environment:',
      ...columns(ENVIRONMENT),
      '',
      'Exit codes:',
      ...columns(ExitCodes.descriptions()),
      '',
      'Examples:',
      '  majora games mine',
      '  majora npcs list --game epic-quest',
      '  majora npcs get 12 --game epic-quest --restricted',
      '',
    ].join('\n');
  }

  /**
   * The `majora <resource> --help` text.
   * @param {string} resource - The resource name.
   * @returns {string} The help, ending with a newline.
   * @throws {Error} When the resource does not exist.
   */
  static resource(resource) {
    const definition = CommandRegistry.resource(resource);

    if (!definition) {
      throw new Error(`Unknown resource: ${resource}`);
    }

    const game = definition.gameScoped ? ' --game <slug>' : '';
    const scope = definition.gameScoped
      ? 'Needs --game <slug> (or MAJORA_GAME).'
      : 'Not game-scoped: --game is ignored.';
    const actions = definition.actions.map((action) => [
      actionUsage(resource, action), ACTIONS[action],
    ]);

    return [
      `Usage: majora ${resource} <action>${game} [flags]`,
      '',
      `${definition.description}. ${scope}`,
      '',
      'Actions:',
      ...columns(actions),
      '',
      'See majora --help for the flags, environment variables and exit codes.',
      '',
    ].join('\n');
  }
}
