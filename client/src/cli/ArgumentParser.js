import { parseArgs } from 'node:util';
import { UsageError } from '../core/errors/UsageError.js';
import { CommandRegistry } from './CommandRegistry.js';

/**
 * The `util.parseArgs` option definitions. There is deliberately no `--token` flag: a token
 * on the command line ends up in shell history and in `ps` output.
 * @type {object}
 */
const OPTIONS = Object.freeze({
  url: { type: 'string' },
  'token-file': { type: 'string' },
  'allow-insecure-http': { type: 'boolean' },
  game: { type: 'string' },
  restricted: { type: 'boolean' },
  page: { type: 'string' },
  'per-page': { type: 'string' },
  all: { type: 'boolean' },
  meta: { type: 'boolean' },
  query: { type: 'string', multiple: true },
  data: { type: 'string' },
  timeout: { type: 'string' },
  retries: { type: 'string' },
  debug: { type: 'boolean' },
  help: { type: 'boolean' },
  version: { type: 'boolean' },
});

/**
 * Hint given when someone tries to pass the token on the command line.
 * @type {string}
 */
const TOKEN_FLAG_HINT = 'There is no --token flag: set MAJORA_TOKEN or use --token-file';

/**
 * Tells whether an argument is an attempt at a `--token` flag.
 * @param {string} arg - One raw argument.
 * @returns {boolean} `true` for `--token` and `--token=...`.
 */
function isTokenFlag(arg) {
  return arg === '--token' || String(arg).startsWith('--token=');
}

/**
 * Runs `util.parseArgs` in strict mode, mapping its errors to `UsageError`.
 * @param {string[]} argv - The arguments, without `node` and the script.
 * @returns {{values: object, positionals: string[]}} The parsed arguments.
 * @throws {UsageError} On an unknown flag or a bad flag value.
 */
function rawParse(argv) {
  try {
    return parseArgs({ args: argv, options: OPTIONS, strict: true, allowPositionals: true });
  } catch (error) {
    if (argv.some(isTokenFlag)) {
      throw new UsageError(TOKEN_FLAG_HINT);
    }
    throw new UsageError(error.message);
  }
}

/**
 * Parses an integer flag.
 * @param {string} name - The flag name, for the error message.
 * @param {string|undefined} value - The raw value.
 * @param {number} min - The smallest allowed value.
 * @returns {number|undefined} The integer, or `undefined` when the flag is absent.
 * @throws {UsageError} When the value is not an integer of at least `min`.
 */
function integerFlag(name, value, min) {
  if (value === undefined) {
    return undefined;
  }

  const number = /^\d+$/.test(value) ? Number(value) : NaN;

  if (!Number.isSafeInteger(number) || number < min) {
    const kind = min > 0 ? 'a positive' : 'a non-negative';

    throw new UsageError(`--${name} must be ${kind} integer, got: ${value}`);
  }

  return number;
}

/**
 * Builds the `query` filter object from the repeated `--query key=value` flags. Each one is
 * split on its first `=`, so values may contain `=`.
 * @param {string[]|undefined} entries - The raw `--query` values.
 * @returns {object|undefined} The filters, or `undefined` when there are none.
 * @throws {UsageError} When an entry has no `=` or an empty key.
 */
function queryFlag(entries) {
  if (!entries || entries.length === 0) {
    return undefined;
  }

  const query = {};

  for (const entry of entries) {
    const index = entry.indexOf('=');

    if (index <= 0) {
      throw new UsageError(`--query must be key=value, got: ${entry}`);
    }
    query[entry.slice(0, index)] = entry.slice(index + 1);
  }

  return query;
}

/**
 * Builds the normalized options from the parsed flag values.
 * @param {object} values - The `util.parseArgs` values.
 * @returns {object} The options (camelCase, integers parsed, `query` built).
 * @throws {UsageError} On a bad integer or `--query` value.
 */
function buildOptions(values) {
  return {
    url: values.url,
    tokenFile: values['token-file'],
    allowInsecureHttp: values['allow-insecure-http'] === true,
    game: values.game,
    restricted: values.restricted === true,
    page: integerFlag('page', values.page, 1),
    perPage: integerFlag('per-page', values['per-page'], 1),
    all: values.all === true,
    meta: values.meta === true,
    query: queryFlag(values.query),
    data: values.data,
    timeout: integerFlag('timeout', values.timeout, 0),
    retries: integerFlag('retries', values.retries, 0),
    debug: values.debug === true,
  };
}

/**
 * Turns `argv` into a validated command, before any client is built:
 * `majora <resource> <action> [<id>] [flags]`.
 *
 * Every problem (unknown flag, resource or action, missing `<id>`, `--data` on a read,
 * `--all` with `--page`, a game-scoped command without a game, ...) throws `UsageError`.
 * `--help` and `--version` short-circuit the command checks.
 */
export class ArgumentParser {
  #env;

  /**
   * Builds the parser.
   * @param {object} [options] - Parser options.
   * @param {object} [options.env] - Environment, for the `MAJORA_GAME` fallback.
   */
  constructor({ env = {} } = {}) {
    this.#env = env || {};
  }

  /**
   * Parses the arguments.
   * @param {string[]} argv - The arguments, without `node` and the script.
   * @returns {{resource: (string|undefined), action: (string|undefined),
   *   id: (string|undefined), options: object, help: boolean, version: boolean}} The command.
   * @throws {UsageError} When the arguments are invalid.
   */
  parse(argv) {
    const { values, positionals } = rawParse(argv);
    const flags = { help: values.help === true, version: values.version === true };

    if (flags.help || flags.version) {
      return { ...this.#helpCommand(positionals), ...flags, options: { debug: values.debug === true } };
    }

    const options = buildOptions(values);
    const command = this.#command(positionals, options);

    return { ...command, options, ...flags };
  }

  /**
   * The resource of a `--help` / `--version` call (only a known one is kept).
   * @param {string[]} positionals - The positional arguments.
   * @returns {{resource: (string|undefined)}} The resource for per-resource help.
   * @throws {UsageError} When the resource is unknown.
   */
  #helpCommand(positionals) {
    const [resource] = positionals;

    if (resource !== undefined && !CommandRegistry.hasResource(resource)) {
      throw new UsageError(`Unknown resource: ${resource}`);
    }

    return { resource };
  }

  /**
   * Validates the positionals and the flags that depend on the command.
   * @param {string[]} positionals - The positional arguments.
   * @param {object} options - The normalized options (`game` gets the fallback).
   * @returns {{resource: string, action: string, id: (string|undefined)}} The command.
   * @throws {UsageError} When the command is invalid.
   */
  #command(positionals, options) {
    const [resource, action, id, ...extra] = positionals;

    this.#checkResourceAction(resource, action);
    this.#checkId(action, id, extra);
    this.#checkFlags(action, options);
    this.#resolveGame(resource, options);

    return { resource, action, id };
  }

  /**
   * Checks the resource and the action.
   * @param {string|undefined} resource - The resource name.
   * @param {string|undefined} action - The action name.
   * @throws {UsageError} When either is missing or unknown.
   */
  #checkResourceAction(resource, action) {
    if (resource === undefined) {
      throw new UsageError('Missing resource: see majora --help');
    }
    if (!CommandRegistry.hasResource(resource)) {
      throw new UsageError(`Unknown resource: ${resource}`);
    }
    if (action === undefined) {
      throw new UsageError(`Missing action for ${resource}: see majora ${resource} --help`);
    }
    if (!CommandRegistry.hasAction(resource, action)) {
      throw new UsageError(`Unknown action for ${resource}: ${action}`);
    }
  }

  /**
   * Checks the `<id>` positional and that nothing follows it.
   * @param {string} action - The action name.
   * @param {string|undefined} id - The id positional.
   * @param {string[]} extra - Any further positionals.
   * @throws {UsageError} When the id is missing, unexpected, or followed by more arguments.
   */
  #checkId(action, id, extra) {
    const needsId = CommandRegistry.needsId(action);

    if (needsId && (id === undefined || id === '')) {
      throw new UsageError(`Missing <id> for ${action}`);
    }

    const unexpected = needsId ? extra : [id, ...extra].filter((value) => value !== undefined);

    if (unexpected.length > 0) {
      throw new UsageError(`Unexpected argument: ${unexpected[0]}`);
    }
  }

  /**
   * Checks the flags that depend on the action.
   * @param {string} action - The action name.
   * @param {object} options - The normalized options.
   * @throws {UsageError} On `--data` with a read, a missing `--data` on a write, or `--all`
   *   with `--page`.
   */
  #checkFlags(action, options) {
    const takesBody = CommandRegistry.takesBody(action);

    if (!takesBody && options.data !== undefined) {
      throw new UsageError(`--data is not allowed on ${action}`);
    }
    if (takesBody && options.data === undefined) {
      throw new UsageError(`Missing --data for ${action}`);
    }
    if (options.all && options.page !== undefined) {
      throw new UsageError('--all cannot be combined with --page');
    }
  }

  /**
   * Resolves `--game` from the `MAJORA_GAME` fallback for game-scoped resources. The flag is
   * ignored on `games`, which is not game-scoped.
   * @param {string} resource - The resource name.
   * @param {object} options - The normalized options, updated in place.
   * @throws {UsageError} When a game-scoped command has no game.
   */
  #resolveGame(resource, options) {
    if (!CommandRegistry.isGameScoped(resource)) {
      options.game = undefined;
      return;
    }

    const game = options.game || this.#env.MAJORA_GAME;

    if (!game) {
      throw new UsageError(`Missing game for ${resource}: pass --game <slug> or set MAJORA_GAME`);
    }
    options.game = game;
  }
}
