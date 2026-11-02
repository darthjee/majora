import parseJsonOrReject from '../../../../../assets/js/utils/http/parseJsonOrReject.js';
import HttpResponseError from '../../../../../assets/js/utils/http/HttpResponseError.js';

describe('parseJsonOrReject', function() {
  it('resolves with the parsed JSON body when the response is ok', async function() {
    const data = { id: 1 };
    const response = { ok: true, json: () => Promise.resolve(data) };

    await expectAsync(parseJsonOrReject(response, 'failed')).toBeResolvedTo(data);
  });

  it('rejects with an Error carrying the given message when the response is not ok', async function() {
    const response = { ok: false };

    await expectAsync(parseJsonOrReject(response, 'request failed'))
      .toBeRejectedWithError('request failed');
  });

  it('rejects with the status and the JSON body when the response is not ok', async function() {
    const body = { errors: { detail: ['domain_not_recognized'] } };
    const response = { ok: false, status: 404, json: () => Promise.resolve(body) };
    let error;

    try {
      await parseJsonOrReject(response, 'request failed');
    } catch (caught) {
      error = caught;
    }

    expect(error).toEqual(jasmine.any(HttpResponseError));
    expect(error.message).toEqual('request failed');
    expect(error.status).toEqual(404);
    expect(error.body).toEqual(body);
    expect(error.hasErrorCode('domain_not_recognized')).toBeTrue();
  });

  it('rejects with a null body when the body is not JSON', async function() {
    const response = {
      ok: false,
      status: 500,
      json: () => Promise.reject(new SyntaxError('bad json')),
    };
    let error;

    try {
      await parseJsonOrReject(response, 'request failed');
    } catch (caught) {
      error = caught;
    }

    expect(error).toEqual(jasmine.any(HttpResponseError));
    expect(error.status).toEqual(500);
    expect(error.body).toBeNull();
  });

  it('rejects with a null body when json throws synchronously', async function() {
    const response = {
      ok: false,
      status: 502,
      json: () => { throw new Error('boom'); },
    };

    await expectAsync(parseJsonOrReject(response, 'request failed'))
      .toBeRejectedWith(jasmine.objectContaining({ status: 502, body: null }));
  });
});
