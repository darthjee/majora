import { ApiError } from '../../../src/core/errors/ApiError.js';
import { MajoraError } from '../../../src/core/errors/MajoraError.js';

describe('ApiError', () => {
  const response = {
    status: 409,
    method: 'POST',
    path: '/games/x/npcs.json',
    body: { errors: { slug: ['taken'] } },
  };

  it('extends MajoraError', () => {
    expect(new ApiError(response)).toEqual(jasmine.any(MajoraError));
  });

  it('carries the response details', () => {
    const error = new ApiError(response);

    expect(error.status).toEqual(409);
    expect(error.method).toEqual('POST');
    expect(error.path).toEqual('/games/x/npcs.json');
    expect(error.body).toEqual(response.body);
    expect(error.codes).toEqual(['taken']);
    expect(error.name).toEqual('ApiError');
  });

  it('builds a readable message with the codes', () => {
    expect(new ApiError(response).message).toEqual('409 ApiError on POST /games/x/npcs.json: taken');
  });

  it('omits the codes part when there is none', () => {
    const error = new ApiError({ status: 418, method: 'GET', path: '/tea.json', body: '' });

    expect(error.message).toEqual('418 ApiError on GET /tea.json');
    expect(error.codes).toEqual([]);
  });

  it('defaults the body to null', () => {
    expect(new ApiError({ status: 409, method: 'GET', path: '/a.json' }).body).toBeNull();
  });
});
