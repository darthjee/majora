import PlayerSlainConfirmController
  from '../../../../../../assets/js/components/elements/controllers/PlayerSlainConfirmController.js';

describe('PlayerSlainConfirmController', function() {
  let onSuccess;
  let client;

  beforeEach(function() {
    onSuccess = jasmine.createSpy('onSuccess');
    client = {
      setNpcPublicSlainAsPlayer: jasmine.createSpy('setNpcPublicSlainAsPlayer'),
    };
  });

  describe('#handleConfirm', function() {
    it('calls setNpcPublicSlainAsPlayer with the flipped slain value when the character is alive', async function() {
      client.setNpcPublicSlainAsPlayer.and.returnValue(Promise.resolve({ ok: true }));
      const controller = new PlayerSlainConfirmController(onSuccess, client);
      const character = { id: 7, slain: false };

      await controller.handleConfirm('demo', character, 'auth-token');

      expect(client.setNpcPublicSlainAsPlayer).toHaveBeenCalledWith('demo', 7, 'auth-token', true);
    });

    it('calls setNpcPublicSlainAsPlayer with the flipped slain value when the character is slain', async function() {
      client.setNpcPublicSlainAsPlayer.and.returnValue(Promise.resolve({ ok: true }));
      const controller = new PlayerSlainConfirmController(onSuccess, client);
      const character = { id: 7, slain: true };

      await controller.handleConfirm('demo', character, 'auth-token');

      expect(client.setNpcPublicSlainAsPlayer).toHaveBeenCalledWith('demo', 7, 'auth-token', false);
    });

    it('invokes onSuccess once the request resolves', async function() {
      client.setNpcPublicSlainAsPlayer.and.returnValue(Promise.resolve({ ok: true }));
      const controller = new PlayerSlainConfirmController(onSuccess, client);

      await controller.handleConfirm('demo', { id: 7, slain: false }, 'auth-token');

      expect(onSuccess).toHaveBeenCalled();
    });

    it('does not invoke onSuccess when the request rejects', async function() {
      client.setNpcPublicSlainAsPlayer.and.returnValue(Promise.reject(new Error('network error')));
      const controller = new PlayerSlainConfirmController(onSuccess, client);

      await expectAsync(
        controller.handleConfirm('demo', { id: 7, slain: false }, 'auth-token'),
      ).toBeRejected();

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});
