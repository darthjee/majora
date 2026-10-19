import { ApiError } from './ApiError.js';

/**
 * Raised for any 5xx response. The body may be raw HTML from the proxy.
 */
export class ServerError extends ApiError {}
