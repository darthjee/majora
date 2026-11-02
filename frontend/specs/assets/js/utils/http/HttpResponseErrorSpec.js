import HttpResponseError from '../../../../../assets/js/utils/http/HttpResponseError.js';

describe('HttpResponseError', function() {
  it('is an Error carrying the message, status and body', function() {
    const body = { errors: { detail: ['domain_not_recognized'] } };
    const error = new HttpResponseError('failed', 404, body);

    expect(error).toEqual(jasmine.any(Error));
    expect(error.message).toEqual('failed');
    expect(error.status).toEqual(404);
    expect(error.body).toEqual(body);
    expect(error.name).toEqual('HttpResponseError');
  });

  it('defaults the body to null', function() {
    expect(new HttpResponseError('failed', 500).body).toBeNull();
  });

  describe('#errorCodes', function() {
    it('returns the codes in body.errors.detail', function() {
      const error = new HttpResponseError('failed', 404, { errors: { detail: ['a', 'b'] } });

      expect(error.errorCodes()).toEqual(['a', 'b']);
    });

    it('returns an empty array when the body is null', function() {
      expect(new HttpResponseError('failed', 500, null).errorCodes()).toEqual([]);
    });

    it('returns an empty array when detail is not an array', function() {
      const error = new HttpResponseError('failed', 400, { errors: { detail: 'oops' } });

      expect(error.errorCodes()).toEqual([]);
    });
  });

  describe('#hasErrorCode', function() {
    const error = new HttpResponseError('failed', 404, {
      errors: { detail: ['domain_not_recognized'] },
    });

    it('returns true when the code is present', function() {
      expect(error.hasErrorCode('domain_not_recognized')).toBeTrue();
    });

    it('returns false when the code is absent', function() {
      expect(error.hasErrorCode('other')).toBeFalse();
    });
  });
});
