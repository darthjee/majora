const LEVELS = ['error', 'warn', 'info', 'debug'];
const DEFAULT_LEVEL = 'error';

const requestedLevel = import.meta.env?.VITE_FRONTEND_LOG_LEVEL;
const CONFIGURED_LEVEL = LEVELS.includes(requestedLevel) ? requestedLevel : DEFAULT_LEVEL;

/**
 * Build-time-gated logger, kept separate so verbose diagnostics (e.g. every
 * {@link AccessStore} check) can be toggled on/off per deploy without a code
 * change.
 *
 * @description Reads `VITE_FRONTEND_LOG_LEVEL` from `import.meta.env` once
 *   at module load, falling back to `'error'` when it's unset or isn't one
 *   of the four known level names (`error`, `warn`, `info`, `debug`, most to
 *   least severe). Each static method below only delegates to the matching
 *   `console` method when that level is at or above (i.e. as-or-more severe
 *   than) the configured threshold; otherwise it's a no-op. `error` calls
 *   are effectively always emitted, since there's no level more severe than
 *   it.
 */
export default class MajoraLogger {
  /**
   * Logs `data` at the `error` level.
   *
   * @param {*} data - Payload to log.
   * @returns {void}
   */
  static error(data) {
    MajoraLogger.#log('error', data);
  }

  /**
   * Logs `data` at the `warn` level.
   *
   * @param {*} data - Payload to log.
   * @returns {void}
   */
  static warn(data) {
    MajoraLogger.#log('warn', data);
  }

  /**
   * Logs `data` at the `info` level.
   *
   * @param {*} data - Payload to log.
   * @returns {void}
   */
  static info(data) {
    MajoraLogger.#log('info', data);
  }

  /**
   * Logs `data` at the `debug` level.
   *
   * @param {*} data - Payload to log.
   * @returns {void}
   */
  static debug(data) {
    MajoraLogger.#log('debug', data);
  }

  static #log(level, data) {
    if (LEVELS.indexOf(level) > LEVELS.indexOf(CONFIGURED_LEVEL)) {
      return;
    }

    // eslint-disable-next-line no-console -- MajoraLogger is the sanctioned console wrapper.
    console[level](data);
  }
}
