import { ApiError } from '../../../src/core/errors/ApiError.js';
import { AuthenticationError } from '../../../src/core/errors/AuthenticationError.js';
import { NotFoundError } from '../../../src/core/errors/NotFoundError.js';
import { PermissionError } from '../../../src/core/errors/PermissionError.js';
import { ServerError } from '../../../src/core/errors/ServerError.js';
import { ValidationError } from '../../../src/core/errors/ValidationError.js';
import { buildApiError } from '../../../src/core/errors/buildApiError.js';

describe('buildApiError', () => {
  const build = (status, body = null) => buildApiError({
    status, method: 'GET', path: '/games/x/npcs/all.json', body,
  });

  const cases = [
    [400, ValidationError, { errors: { name: ['blank'] } }, ['blank']],
    [401, AuthenticationError, { detail: 'token_invalid' }, ['token_invalid']],
    [403, PermissionError, { errors: { detail: ['scope_missing'] } }, ['scope_missing']],
    [403, PermissionError, { detail: 'You do not have permission.' }, ['You do not have permission.']],
    [403, PermissionError, '', []],
    [404, NotFoundError, '', []],
    [404, NotFoundError, { detail: 'Not found.' }, ['Not found.']],
    [422, ApiError, { error: 'Unprocessable Entity', reason: 'too_large' }, ['Unprocessable Entity', 'too_large']],
    [422, ApiError, { status: 'failed', error: 'not_available' }, ['not_available']],
    [409, ApiError, null, []],
    [500, ServerError, { detail: 'oops' }, ['oops']],
    [502, ServerError, '<html><body><h1>502 Bad Gateway</h1></body></html>', []],
    [504, ServerError, '', []],
  ];

  cases.forEach(([status, ErrorClass, body, codes]) => {
    describe(`for a ${status} with body ${JSON.stringify(body)}`, () => {
      it(`builds a ${ErrorClass.name}`, () => {
        const error = build(status, body);

        expect(error).toEqual(jasmine.any(ErrorClass));
        expect(error).toEqual(jasmine.any(ApiError));
        expect(error.constructor).toBe(ErrorClass);
        expect(error.name).toEqual(ErrorClass.name);
      });

      it('extracts the codes and keeps the body', () => {
        const error = build(status, body);

        expect(error.codes).toEqual(codes);
        expect(error.body).toEqual(body);
        expect(error.status).toEqual(status);
      });
    });
  });

  it('builds the message with the class name', () => {
    const error = build(403, { errors: { detail: ['scope_missing'] } });

    expect(error.message).toEqual('403 PermissionError on GET /games/x/npcs/all.json: scope_missing');
  });

  it('does not map 4xx statuses other than 400, 401, 403 and 404 to a subclass', () => {
    expect(build(429).constructor).toBe(ApiError);
    expect(build(499).constructor).toBe(ApiError);
    expect(build(600).constructor).toBe(ApiError);
  });
});
