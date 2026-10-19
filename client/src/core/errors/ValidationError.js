import { ApiError } from './ApiError.js';

/**
 * Raised for a 400 response. `fields` maps each invalid field to its codes, e.g.
 * `{ name: ['blank'] }`.
 */
export class ValidationError extends ApiError {
  /**
   * Builds the error and extracts `fields` from the body's `errors` object.
   * @param {object} response - The failed response (see `ApiError`).
   */
  constructor(response) {
    super(response);
    const errors = this.body && this.body.errors;
    const isObject = typeof errors === 'object' && errors !== null && !Array.isArray(errors);

    this.fields = isObject ? errors : {};
  }
}
