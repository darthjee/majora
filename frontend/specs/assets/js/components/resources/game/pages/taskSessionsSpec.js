import {
  SESSION_PICKER_MAX_ENTRIES,
  buildSessionPicker,
  toTaskSessionPick,
} from '../../../../../../../assets/js/components/resources/game/pages/taskSessions.js';

describe('taskSessions', function() {
  describe('SESSION_PICKER_MAX_ENTRIES', function() {
    it('is 5', function() {
      expect(SESSION_PICKER_MAX_ENTRIES).toBe(5);
    });
  });

  describe('.buildSessionPicker', function() {
    it('builds a game-scoped session picker config', function() {
      expect(buildSessionPicker('the-crypt')).toEqual({
        resource: 'session', maxEntries: 5, params: { gameSlug: 'the-crypt' },
      });
    });
  });

  describe('.toTaskSessionPick', function() {
    it('shapes a session as an {id, name} pick', function() {
      expect(toTaskSessionPick({ id: 3, title: 'Session 3' })).toEqual({ id: 3, name: 'Session 3' });
    });

    it('returns null for a null session', function() {
      expect(toTaskSessionPick(null)).toBeNull();
    });

    it('returns null for a missing session', function() {
      expect(toTaskSessionPick(undefined)).toBeNull();
    });
  });
});
