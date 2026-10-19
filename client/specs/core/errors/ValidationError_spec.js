import { ValidationError } from '../../../src/core/errors/ValidationError.js';

describe('ValidationError', () => {
  const build = (body) => new ValidationError({ status: 400, method: 'POST', path: '/games/x/npcs.json', body });

  it('exposes the field errors', () => {
    expect(build({ errors: { name: ['blank'] } }).fields).toEqual({ name: ['blank'] });
  });

  it('defaults fields to an empty object for unexpected bodies', () => {
    expect(build(null).fields).toEqual({});
    expect(build('Bad Request').fields).toEqual({});
    expect(build({ errors: ['blank'] }).fields).toEqual({});
    expect(build({ errors: null }).fields).toEqual({});
  });

  it('builds a readable message', () => {
    expect(build({ errors: { name: ['blank'] } }).message)
      .toEqual('400 ValidationError on POST /games/x/npcs.json: blank');
  });
});
