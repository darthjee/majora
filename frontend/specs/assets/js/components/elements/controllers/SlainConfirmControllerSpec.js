import SlainConfirmController from '../../../../../../assets/js/components/elements/controllers/SlainConfirmController.js';

describe('SlainConfirmController', function() {
  let onSuccess;
  let client;

  beforeEach(function() {
    onSuccess = jasmine.createSpy('onSuccess');
    client = {
      setNpcSlain: jasmine.createSpy('setNpcSlain'),
    };
  });

  describe('#handleConfirm', function() {
    it('calls setNpcSlain with the flipped slain value when the character is alive', async function() {
      client.setNpcSlain.and.returnValue(Promise.resolve({ ok: true }));
      const controller = new SlainConfirmController(onSuccess, client);
      const character = { id: 7, slain: false };

      await controller.handleConfirm('demo', character, 'auth-token');

      expect(client.setNpcSlain).toHaveBeenCalledWith('demo', 7, 'auth-token', true);
    });

    it('calls setNpcSlain with the flipped slain value when the character is slain', async function() {
      client.setNpcSlain.and.returnValue(Promise.resolve({ ok: true }));
      const controller = new SlainConfirmController(onSuccess, client);
      const character = { id: 7, slain: true };

      await controller.handleConfirm('demo', character, 'auth-token');

      expect(client.setNpcSlain).toHaveBeenCalledWith('demo', 7, 'auth-token', false);
    });

    it('invokes onSuccess once the request resolves', async function() {
      client.setNpcSlain.and.returnValue(Promise.resolve({ ok: true }));
      const controller = new SlainConfirmController(onSuccess, client);

      await controller.handleConfirm('demo', { id: 7, slain: false }, 'auth-token');

      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
