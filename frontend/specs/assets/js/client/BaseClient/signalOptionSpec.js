import BaseClient from '../../../../../assets/js/client/BaseClient.js';
import ActivityTracker from '../../../../../assets/js/utils/ActivityTracker.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('BaseClient', function() {
  let fetchSpy;
  let client;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
    spyOn(ActivityTracker, 'register');
    client = new BaseClient();
  });

  it('passes the signal option through to fetch when provided', async function() {
    const controller = new AbortController();

    await client.request('/some/path.json', { signal: controller.signal });

    expect(fetchSpy).toHaveBeenCalledWith('/some/path.json', jasmine.objectContaining({
      signal: controller.signal,
    }));
  });

  it('attaches a default timeout signal when none is provided', async function() {
    await client.request('/some/path.json');

    const [, options] = fetchSpy.calls.mostRecent().args;
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });
});
