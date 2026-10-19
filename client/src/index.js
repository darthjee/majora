/**
 * Public surface of the Majora client: `MajoraClient` and the error classes. Everything
 * under `core/` is internal and may change without a breaking release.
 */
export { MajoraClient } from './MajoraClient.js';
export { MajoraError } from './core/errors/MajoraError.js';
export { ConfigurationError } from './core/errors/ConfigurationError.js';
export { UsageError } from './core/errors/UsageError.js';
export { NetworkError } from './core/errors/NetworkError.js';
export { ApiError } from './core/errors/ApiError.js';
export { ValidationError } from './core/errors/ValidationError.js';
export { AuthenticationError } from './core/errors/AuthenticationError.js';
export { PermissionError } from './core/errors/PermissionError.js';
export { NotFoundError } from './core/errors/NotFoundError.js';
export { ServerError } from './core/errors/ServerError.js';
