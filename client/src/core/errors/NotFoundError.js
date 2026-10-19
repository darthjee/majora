import { ApiError } from './ApiError.js';

/**
 * Raised for a 404 response (missing, or hidden from the token's user).
 */
export class NotFoundError extends ApiError {}
