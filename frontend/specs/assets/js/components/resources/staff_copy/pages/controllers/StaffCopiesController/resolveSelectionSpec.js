import StaffCopiesController from '../../../../../../../../../assets/js/components/resources/staff_copy/pages/controllers/StaffCopiesController.js';
import { GAMES } from './support.js';

describe('StaffCopiesController', function() {
  describe('.resolveSelection', function() {
    it('keeps a known type and known games', function() {
      expect(StaffCopiesController.resolveSelection(
        ['items', 'factions'], GAMES, { type: 'factions', from: 'source-game', to: 'target-game' },
      )).toEqual({ type: 'factions', from: 'source-game', to: 'target-game' });
    });

    it('falls back to the first type and drops unknown games', function() {
      expect(StaffCopiesController.resolveSelection(
        ['items'], GAMES, { type: 'stale', from: 'gone', to: '' },
      )).toEqual({ type: 'items', from: '', to: '' });
    });

    it('resolves an empty type when there are no types', function() {
      expect(StaffCopiesController.resolveSelection([], [], { type: 'items', from: '', to: '' }).type).toBe('');
    });
  });
});
