import { MajoraError } from '../../../src/core/errors/MajoraError.js';
import { NetworkError } from '../../../src/core/errors/NetworkError.js';

describe('NetworkError', () => {
  it('extends MajoraError', () => {
    expect(new NetworkError('down')).toEqual(jasmine.any(MajoraError));
  });

  it('is not a timeout by default', () => {
    const error = new NetworkError('down');

    expect(error.timeout).toBeFalse();
    expect(error.cause).toBeUndefined();
    expect(error.name).toEqual('NetworkError');
  });

  it('keeps the cause and the timeout flag', () => {
    const cause = new Error('aborted');
    const error = new NetworkError('timed out', { cause, timeout: true });

    expect(error.cause).toBe(cause);
    expect(error.timeout).toBeTrue();
  });
});
