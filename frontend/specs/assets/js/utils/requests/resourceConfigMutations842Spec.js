import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';

/**
 * Covers the `POST`/`PATCH`/`PUT` mutation entries `sessionConfig.js`/`treasureConfig.js` gained,
 * and the brand-new `pollConfig.js`/`taskConfig.js`/`staffUserConfig.js` resources introduced, in
 * issue #842 — split into its own file (rather than added to `resourceConfigMutationsSpec.js`) to
 * keep every mutation-config spec file under the project's 300-line limit.
 */
describe('resourceConfig mutations (issue #842)', function() {
  describe('session', function() {
    it('resolves POST.collection (create) as a single un-branched, can_edit-gated variant', function() {
      const collection = resourceConfig.get('POST', 'session', 'collection');

      expect(collection.regular).toBe(collection.private);
      expect(collection.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/sessions.json');
      expect(collection.regular.permission).toBe('can_edit');
    });

    it('resolves PATCH.single (update) as a single un-branched variant, reusing the GET single path', function() {
      const single = resourceConfig.get('PATCH', 'session', 'single');

      expect(single.regular).toBe(single.private);
      expect(single.regular.path({ gameSlug: 'demo', id: '3' })).toBe('/games/demo/sessions/3.json');
      expect(single.regular.permission).toBeNull();
    });

    it('resolves POST.message (message post) as a single un-branched variant', function() {
      const message = resourceConfig.get('POST', 'session', 'message');

      expect(message.regular).toBe(message.private);
      expect(message.regular.path({ gameSlug: 'demo', id: '3' })).toBe('/games/demo/sessions/3/messages.json');
      expect(message.regular.permission).toBeNull();
    });

    it('resolves POST.pollProposal (session-scoped poll creation) as a single un-branched variant', function() {
      const pollProposal = resourceConfig.get('POST', 'session', 'pollProposal');

      expect(pollProposal.regular).toBe(pollProposal.private);
      expect(pollProposal.regular.path({ gameSlug: 'demo', id: '3' })).toBe('/games/demo/sessions/3/poll.json');
      expect(pollProposal.regular.permission).toBeNull();
    });
  });

  describe('treasure', function() {
    it('resolves POST.link (link existing catalog treasure) as a single un-branched variant', function() {
      const link = resourceConfig.get('POST', 'treasure', 'link');

      expect(link.regular).toBe(link.private);
      expect(link.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/treasures/link.json');
      expect(link.regular.permission).toBe('can_edit');
    });
  });

  describe('poll', function() {
    it('resolves GET.collection as a single un-branched variant', function() {
      const collection = resourceConfig.get('GET', 'poll', 'collection');

      expect(collection.regular).toBe(collection.private);
      expect(collection.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/polls.json');
      expect(collection.regular.permission).toBeNull();
    });

    it('resolves GET.single with a skipCache flag, as a single un-branched variant', function() {
      const single = resourceConfig.get('GET', 'poll', 'single');

      expect(single.regular).toBe(single.private);
      expect(single.regular.path({ gameSlug: 'demo', id: '7' })).toBe('/games/demo/polls/7.json');
      expect(single.regular.permission).toBeNull();
      expect(single.regular.skipCache).toBe(true);
    });

    it('resolves GET.votes/PUT.votes onto the same path, as a single un-branched variant', function() {
      const getVotes = resourceConfig.get('GET', 'poll', 'votes');
      const putVotes = resourceConfig.get('PUT', 'poll', 'votes');

      expect(getVotes.regular).toBe(getVotes.private);
      expect(getVotes.regular.path({ gameSlug: 'demo', id: '7' })).toBe('/games/demo/polls/7/votes.json');
      expect(putVotes.regular.path({ gameSlug: 'demo', id: '7' })).toBe('/games/demo/polls/7/votes.json');
    });

    it('resolves POST.collection (create) as a single un-branched variant', function() {
      const collection = resourceConfig.get('POST', 'poll', 'collection');

      expect(collection.regular).toBe(collection.private);
      expect(collection.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/polls.json');
      expect(collection.regular.permission).toBeNull();
    });

    it('resolves PATCH.close as a single un-branched variant', function() {
      const close = resourceConfig.get('PATCH', 'poll', 'close');

      expect(close.regular).toBe(close.private);
      expect(close.regular.path({ gameSlug: 'demo', id: '7' })).toBe('/games/demo/polls/7/close.json');
      expect(close.regular.permission).toBeNull();
    });
  });

  describe('task', function() {
    it('resolves GET.collection/POST.collection onto the same path, as a single un-branched variant', function() {
      const getCollection = resourceConfig.get('GET', 'task', 'collection');
      const postCollection = resourceConfig.get('POST', 'task', 'collection');

      expect(getCollection.regular).toBe(getCollection.private);
      expect(getCollection.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/tasks.json');
      expect(getCollection.regular.permission).toBeNull();
      expect(postCollection.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/tasks.json');
    });

    it('resolves PATCH.single as a single un-branched variant', function() {
      const single = resourceConfig.get('PATCH', 'task', 'single');

      expect(single.regular).toBe(single.private);
      expect(single.regular.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/tasks/9.json');
      expect(single.regular.permission).toBeNull();
    });
  });

  describe('staffUser', function() {
    it('resolves GET.collection as a single un-branched variant, with no gameSlug param', function() {
      const collection = resourceConfig.get('GET', 'staffUser', 'collection');

      expect(collection.regular).toBe(collection.private);
      expect(collection.regular.path()).toBe('/staff/users.json');
      expect(collection.regular.permission).toBeNull();
    });

    it('resolves GET.single/PATCH.single onto the same path, as a single un-branched variant', function() {
      const getSingle = resourceConfig.get('GET', 'staffUser', 'single');
      const patchSingle = resourceConfig.get('PATCH', 'staffUser', 'single');

      expect(getSingle.regular).toBe(getSingle.private);
      expect(getSingle.regular.path({ id: '9' })).toBe('/staff/users/9.json');
      expect(getSingle.regular.permission).toBeNull();
      expect(patchSingle.regular.path({ id: '9' })).toBe('/staff/users/9.json');
    });

    it('resolves POST.recoveryLink as a single un-branched variant', function() {
      const recoveryLink = resourceConfig.get('POST', 'staffUser', 'recoveryLink');

      expect(recoveryLink.regular).toBe(recoveryLink.private);
      expect(recoveryLink.regular.path({ id: '9' })).toBe('/staff/users/9/recovery-link.json');
      expect(recoveryLink.regular.permission).toBeNull();
    });
  });
});
