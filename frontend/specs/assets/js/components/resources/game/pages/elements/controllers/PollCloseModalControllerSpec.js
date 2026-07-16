import PollCloseModalController
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/controllers/PollCloseModalController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

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
    let pollClient;
    let controller;

    beforeEach(function() {
      pollClient = jasmine.createSpyObj('pollClient', ['fetchPollVotes']);
      controller = new PollCloseModalController(pollClient);
    });

    it('resolves with the tallied votes on success', async function() {
      pollClient.fetchPollVotes.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ option: 10 }, { option: 10 }, { option: 11 }]),
      }));

      const tallies = await controller.fetchTallies('demo', 7, 'tok');

      expect(pollClient.fetchPollVotes).toHaveBeenCalledWith('demo', 7, 'tok');
      expect(tallies).toEqual({ 10: 2, 11: 1 });
    });

    it('rejects when the response is not ok', async function() {
      pollClient.fetchPollVotes.and.returnValue(Promise.resolve({ ok: false }));

      await expectAsync(controller.fetchTallies('demo', 7, 'tok')).toBeRejected();
    });
  });

  describe('#closePoll', function() {
    let pollClient;
    let controller;
    let setStatus;
    let onClosed;

    beforeEach(function() {
      pollClient = jasmine.createSpyObj('pollClient', ['closePoll']);
      controller = new PollCloseModalController(pollClient);
      setStatus = jasmine.createSpy('setStatus');
      onClosed = jasmine.createSpy('onClosed');
    });

    it('sets the submitting status before sending the request', function() {
      pollClient.closePoll.and.returnValue(new Promise(Noop.noop));

      controller.closePoll('demo', 7, 'tok', null, { setStatus, onClosed });

      expect(setStatus).toHaveBeenCalledWith('submitting');
    });

    it('invokes onClosed with the response payload on success', async function() {
      pollClient.closePoll.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 7, status: 'closed' }),
      }));

      await controller.closePoll('demo', 7, 'tok', 11, { setStatus, onClosed });

      expect(pollClient.closePoll).toHaveBeenCalledWith('demo', 7, 'tok', 11);
      expect(setStatus).toHaveBeenCalledWith('idle');
      expect(onClosed).toHaveBeenCalledWith({ id: 7, status: 'closed' });
    });

    it('sets the error status when the response is not ok', async function() {
      pollClient.closePoll.and.returnValue(Promise.resolve({ ok: false }));

      await controller.closePoll('demo', 7, 'tok', null, { setStatus, onClosed });

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(onClosed).not.toHaveBeenCalled();
    });

    it('sets the error status when the request throws', async function() {
      pollClient.closePoll.and.returnValue(Promise.reject(new Error('network error')));

      await controller.closePoll('demo', 7, 'tok', null, { setStatus, onClosed });

      expect(setStatus).toHaveBeenCalledWith('error');
    });
  });
});
