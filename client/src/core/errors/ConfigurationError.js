import { MajoraError } from './MajoraError.js';

/**
 * Raised locally, at construction time, for a missing `baseUrl` or token, an invalid
 * URL or an insecure `http://` URL.
 */
export class ConfigurationError extends MajoraError {}
