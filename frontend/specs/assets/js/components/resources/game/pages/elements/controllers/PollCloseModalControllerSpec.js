import PollCloseModalController
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/controllers/PollCloseModalController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('PollCloseModalController', function() {
  describe('.tallyVotes', function() {
    it('counts votes per option id', function() {
      const votes = [{ option: 10 }, { option: 11 }, { option: 10 }];

      expect(PollCloseModalController.tallyVotes(votes)).toEqual({ 10: 2, 11: 1 });
    });

    it('returns an empty tally for no votes', function() {
      expect(PollCloseModalController.tallyVotes([])).toEqual({});
    });
  });

  describe('.resolveMaxVoteOptionIds', function() {
    it('returns the single option id with the most votes', function() {
      const options = [{ id: 10 }, { id: 11 }];
      const tallies = { 10: 1, 11: 3 };

      expect(PollCloseModalController.resolveMaxVoteOptionIds(options, tallies)).toEqual([11]);
    });

    it('returns every tied option id when there is a tie', function() {
      const options = [{ id: 10 }, { id: 11 }, { id: 12 }];
      const tallies = { 10: 2, 11: 2, 12: 1 };

      expect(PollCloseModalController.resolveMaxVoteOptionIds(options, tallies)).toEqual([10, 11]);
    });

    it('treats every option as tied at zero when nobody has voted', function() {
      const options = [{ id: 10 }, { id: 11 }];

      expect(PollCloseModalController.resolveMaxVoteOptionIds(options, {})).toEqual([10, 11]);
    });

    it('returns an empty array when there are no options', function() {
      expect(PollCloseModalController.resolveMaxVoteOptionIds([], {})).toEqual([]);
    });
  });

  describe('.resolveEffectiveWinnerId', function() {
    it('returns the lowest id among the tied max-vote set', function() {
      expect(PollCloseModalController.resolveEffectiveWinnerId([11, 10, 12])).toBe(10);
    });

    it('returns the sole id when there is no tie', function() {
      expect(PollCloseModalController.resolveEffectiveWinnerId([11])).toBe(11);
    });

    it('returns null when there are no candidate ids', function() {
      expect(PollCloseModalController.resolveEffectiveWinnerId([])).toBeNull();
    });
  });

  describe('#fetchTallies', function() {
    let controller;
    let ensureSpy;

    beforeEach(function() {
      controller = new PollCloseModalController();
      ensureSpy = spyOn(RequestStore, 'ensure');
    });

    it('resolves with the tallied votes on success', async function() {
      ensureSpy.and.returnValue(Promise.resolve({
        data: [{ option: 10 }, { option: 10 }, { option: 11 }],
      }));

      const tallies = await controller.fetchTallies('demo', 7);

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'PollCloseModalController',
        resource: 'poll',
        quantityType: 'votes',
        params: { gameSlug: 'demo', id: 7 },
      });
      expect(tallies).toEqual({ 10: 2, 11: 1 });
    });

    it('rejects when the request rejects', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('votes failed')));

      await expectAsync(controller.fetchTallies('demo', 7)).toBeRejected();
    });
  });

  describe('#closePoll', function() {
    let controller;
    let mutateSpy;
    let setStatus;
    let onClosed;

    beforeEach(function() {
      controller = new PollCloseModalController();
      mutateSpy = spyOn(RequestStore, 'mutate');
      setStatus = jasmine.createSpy('setStatus');
      onClosed = jasmine.createSpy('onClosed');
    });

    it('sets the submitting status before sending the request', function() {
      mutateSpy.and.returnValue(new Promise(Noop.noop));

      controller.closePoll('demo', 7, null, { setStatus, onClosed });

      expect(setStatus).toHaveBeenCalledWith('submitting');
    });

    it('invokes onClosed with the response payload on success', async function() {
      mutateSpy.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 7, status: 'closed' }),
      }));

      await controller.closePoll('demo', 7, 11, { setStatus, onClosed });

      expect(mutateSpy).toHaveBeenCalledWith({
        componentName: 'PollCloseModalController',
        resource: 'poll',
        method: 'PATCH',
        quantityType: 'close',
        params: { gameSlug: 'demo', id: 7 },
        body: { option_id: 11 },
      });
      expect(setStatus).toHaveBeenCalledWith('idle');
      expect(onClosed).toHaveBeenCalledWith({ id: 7, status: 'closed' });
    });

    it('sends an empty body when no option id override is given', async function() {
      mutateSpy.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 7, status: 'closed' }),
      }));

      await controller.closePoll('demo', 7, null, { setStatus, onClosed });

      expect(mutateSpy).toHaveBeenCalledWith({
        componentName: 'PollCloseModalController',
        resource: 'poll',
        method: 'PATCH',
        quantityType: 'close',
        params: { gameSlug: 'demo', id: 7 },
        body: {},
      });
    });

    it('sets the error status when the response is not ok', async function() {
      mutateSpy.and.returnValue(Promise.resolve({ ok: false }));

      await controller.closePoll('demo', 7, null, { setStatus, onClosed });

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(onClosed).not.toHaveBeenCalled();
    });

    it('sets the error status when the request throws', async function() {
      mutateSpy.and.returnValue(Promise.reject(new Error('network error')));

      await controller.closePoll('demo', 7, null, { setStatus, onClosed });

      expect(setStatus).toHaveBeenCalledWith('error');
    });
  });
});
