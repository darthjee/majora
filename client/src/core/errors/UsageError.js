import { MajoraError } from './MajoraError.js';

/**
 * Raised locally, before any request, when the library is called with bad arguments
 * (for example a restricted variant that does not exist).
 */
export class UsageError extends MajoraError {}
