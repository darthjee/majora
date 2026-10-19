import { ExitCodes, INTERRUPTED, SUCCESS } from '../../src/cli/ExitCodes.js';
import {
  ApiError, AuthenticationError, ConfigurationError, MajoraError, NetworkError, NotFoundError,
  PermissionError, ServerError, UsageError, ValidationError,
} from '../../src/index.js';

describe('ExitCodes', () => {
  const response = (status) => ({ status, method: 'GET', path: '/games.json', body: null });

  it('exports SUCCESS and INTERRUPTED', () => {
    expect(SUCCESS).toEqual(0);
    expect(INTERRUPTED).toEqual(130);
    expect(ExitCodes.SUCCESS).toEqual(0);
    expect(ExitCodes.INTERRUPTED).toEqual(130);
    expect(ExitCodes.INTERNAL).toEqual(1);
    expect(ExitCodes.USAGE).toEqual(2);
  });

  [
    ['UsageError', () => new UsageError('x'), 2],
    ['ConfigurationError', () => new ConfigurationError('x'), 2],
    ['AuthenticationError', () => new AuthenticationError(response(401)), 3],
    ['PermissionError', () => new PermissionError(response(403)), 4],
    ['NotFoundError', () => new NotFoundError(response(404)), 5],
    ['ValidationError', () => new ValidationError(response(400)), 6],
    ['ApiError (409)', () => new ApiError(response(409)), 7],
    ['ApiError (422)', () => new ApiError(response(422)), 7],
    ['ServerError', () => new ServerError(response(500)), 8],
    ['NetworkError', () => new NetworkError('x'), 9],
    ['NetworkError (timeout)', () => new NetworkError('x', { timeout: true }), 9],
    ['MajoraError', () => new MajoraError('x'), 1],
    ['TypeError', () => new TypeError('x'), 1],
    ['a string', () => 'boom', 1],
    ['undefined', () => undefined, 1],
  ].forEach(([label, build, code]) => {
    it(`maps ${label} to ${code}`, () => {
      expect(ExitCodes.for(build())).toEqual(code);
    });
  });

  it('describes every code', () => {
    expect(ExitCodes.descriptions().map(([code]) => code)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 130]);
  });
});
