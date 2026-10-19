import { MajoraError } from '../../../src/core/errors/MajoraError.js';
import { ConfigurationError } from '../../../src/core/errors/ConfigurationError.js';
import { UsageError } from '../../../src/core/errors/UsageError.js';

describe('MajoraError', () => {
  it('is an Error named after its class', () => {
    const error = new MajoraError('boom');

    expect(error).toEqual(jasmine.any(Error));
    expect(error.name).toEqual('MajoraError');
    expect(error.message).toEqual('boom');
  });

  it('accepts a cause', () => {
    const cause = new Error('inner');

    expect(new MajoraError('boom', { cause }).cause).toBe(cause);
  });

  describe('local subclasses', () => {
    [ConfigurationError, UsageError].forEach((ErrorClass) => {
      it(`${ErrorClass.name} extends MajoraError and is named after its class`, () => {
        const error = new ErrorClass('bad');

        expect(error).toEqual(jasmine.any(MajoraError));
        expect(error.name).toEqual(ErrorClass.name);
        expect(error.message).toEqual('bad');
      });
    });
  });
});
