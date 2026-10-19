/**
 * Base class for every error thrown by the Majora client.
 *
 * Catch it to handle anything the library raises; use the subclasses
 * (`ConfigurationError`, `UsageError`, `NetworkError`, `ApiError`, ...) to tell
 * failures apart with `instanceof`.
 */
export class MajoraError extends Error {
  /**
   * Builds the error, naming it after its concrete class.
   * @param {string} message - Human-readable description.
   * @param {{cause?: unknown}} [options] - Native error options (e.g. `cause`).
   */
  constructor(message, options) {
    super(message, options);
    this.name = new.target.name;
  }
}
