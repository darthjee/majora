import BaseClient from '../../../../../assets/js/client/BaseClient.js';

describe('BaseClient', function() {
  describe('.parseJsonOrReject', function() {
    it('resolves with the parsed JSON body when the response is ok', async function() {
      const data = { id: 1 };
      const response = { ok: true, json: () => Promise.resolve(data) };

      await expectAsync(BaseClient.parseJsonOrReject(response, 'failed')).toBeResolvedTo(data);
    });

    it('rejects with an Error carrying the given message when the response is not ok', async function() {
      const response = { ok: false };

      await expectAsync(BaseClient.parseJsonOrReject(response, 'request failed'))
        .toBeRejectedWithError('request failed');
    });
  });
});
