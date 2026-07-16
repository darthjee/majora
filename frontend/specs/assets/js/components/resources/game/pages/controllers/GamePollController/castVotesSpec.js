import GamePollController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GamePollController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('GamePollController', function() {
  let pollClient;
  let setSelectedOptionIds;
  let setVoteStatus;
  let controller;

  beforeEach(function() {
    pollClient = jasmine.createSpyObj('pollClient', ['castPollVotes']);
    setSelectedOptionIds = jasmine.createSpy('setSelectedOptionIds');
    setVoteStatus = jasmine.createSpy('setVoteStatus');
    controller = new GamePollController(
      jasmine.createSpy('setPoll'),
      jasmine.createSpy('setLoading'),
      jasmine.createSpy('setError'),
      pollClient
    );
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#castVotes', function() {
    it('sets the submitting status before sending the request', async function() {
      pollClient.castPollVotes.and.returnValue(new Promise(Noop.noop));

      controller.castVotes('demo', 7, [10], { setSelectedOptionIds, setVoteStatus });

      expect(setVoteStatus).toHaveBeenCalledWith('submitting');
    });

    it('refreshes the selection from the response on success', async function() {
      pollClient.castPollVotes.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1, option: 10, user: 42 }]),
      }));

      await controller.castVotes('demo', 7, [10], { setSelectedOptionIds, setVoteStatus });

      expect(pollClient.castPollVotes).toHaveBeenCalledWith('demo', 7, null, [10]);
      expect(setSelectedOptionIds).toHaveBeenCalledWith([10]);
      expect(setVoteStatus).toHaveBeenCalledWith('idle');
    });

    it('sets the error status when the response is not ok', async function() {
      pollClient.castPollVotes.and.returnValue(Promise.resolve({ ok: false }));

      await controller.castVotes('demo', 7, [10], { setSelectedOptionIds, setVoteStatus });

      expect(setVoteStatus).toHaveBeenCalledWith('error');
      expect(setSelectedOptionIds).not.toHaveBeenCalled();
    });

    it('sets the error status when the request throws', async function() {
      pollClient.castPollVotes.and.returnValue(Promise.reject(new Error('network error')));

      await controller.castVotes('demo', 7, [10], { setSelectedOptionIds, setVoteStatus });

      expect(setVoteStatus).toHaveBeenCalledWith('error');
    });
  });
});
