import { ApiError } from './ApiError.js';

/**
 * Raised for a 401 response: the token is missing, invalid, expired or revoked.
 */
export class AuthenticationError extends ApiError {}
