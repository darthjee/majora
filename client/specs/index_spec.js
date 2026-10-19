import * as majora from '../src/index.js';
import { MajoraClient } from '../src/MajoraClient.js';
import { MajoraError } from '../src/core/errors/MajoraError.js';
import { ApiError } from '../src/core/errors/ApiError.js';

describe('index', () => {
  it('exports MajoraClient and the error classes, nothing else', () => {
    expect(Object.keys(majora).sort()).toEqual([
      'ApiError',
      'AuthenticationError',
      'ConfigurationError',
      'MajoraClient',
      'MajoraError',
      'NetworkError',
      'NotFoundError',
      'PermissionError',
      'ServerError',
      'UsageError',
      'ValidationError',
    ]);
  });

  it('exports the library classes themselves', () => {
    expect(majora.MajoraClient).toBe(MajoraClient);
    expect(majora.MajoraError).toBe(MajoraError);
    expect(majora.ApiError).toBe(ApiError);
  });

  it('exports error classes that all extend MajoraError', () => {
    Object.entries(majora)
      .filter(([name]) => name !== 'MajoraClient')
      .forEach(([, ErrorClass]) => {
        expect(ErrorClass === MajoraError || ErrorClass.prototype instanceof MajoraError).toBeTrue();
      });
  });

  it('exports API error subclasses that extend ApiError', () => {
    ['ValidationError', 'AuthenticationError', 'PermissionError', 'NotFoundError', 'ServerError']
      .forEach((name) => {
        expect(majora[name].prototype instanceof ApiError).toBeTrue();
      });
  });
});
