import SlainConfirmController from '../../../../../../../../../assets/js/components/resources/character/pages/elements/controllers/SlainConfirmController.js';

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
    it('defaults to toggling the slain field when no field is given', function() {
      client.setNpcSlain.and.returnValue(Promise.resolve({ ok: true }));
      const controller = new SlainConfirmController(onSuccess, undefined, client);
      const character = { id: 7, slain: false };

      return controller.handleConfirm('demo', character, 'auth-token').then(() => {
        expect(client.setNpcSlain).toHaveBeenCalledWith('demo', 7, 'auth-token', { slain: true });
      });
    });

    it('calls setNpcSlain with the flipped slain value when the character is alive', async function() {
      client.setNpcSlain.and.returnValue(Promise.resolve({ ok: true }));
      const controller = new SlainConfirmController(onSuccess, 'slain', client);
      const character = { id: 7, slain: false };

      await controller.handleConfirm('demo', character, 'auth-token');

      expect(client.setNpcSlain).toHaveBeenCalledWith('demo', 7, 'auth-token', { slain: true });
    });

    it('calls setNpcSlain with the flipped slain value when the character is slain', async function() {
      client.setNpcSlain.and.returnValue(Promise.resolve({ ok: true }));
      const controller = new SlainConfirmController(onSuccess, 'slain', client);
      const character = { id: 7, slain: true };

      await controller.handleConfirm('demo', character, 'auth-token');

      expect(client.setNpcSlain).toHaveBeenCalledWith('demo', 7, 'auth-token', { slain: false });
    });

    it('calls setNpcSlain with the flipped public_slain value when toggling the public field', async function() {
      client.setNpcSlain.and.returnValue(Promise.resolve({ ok: true }));
      const controller = new SlainConfirmController(onSuccess, 'public_slain', client);
      const character = { id: 7, slain: false, public_slain: false };

      await controller.handleConfirm('demo', character, 'auth-token');

      expect(client.setNpcSlain).toHaveBeenCalledWith('demo', 7, 'auth-token', { public_slain: true });
    });

    it('does not touch the real slain value when toggling the public field', async function() {
      client.setNpcSlain.and.returnValue(Promise.resolve({ ok: true }));
      const controller = new SlainConfirmController(onSuccess, 'public_slain', client);
      const character = { id: 7, slain: true, public_slain: false };

      await controller.handleConfirm('demo', character, 'auth-token');

      const [, , , fields] = client.setNpcSlain.calls.mostRecent().args;
      expect(fields.slain).toBeUndefined();
    });

    it('invokes onSuccess once the request resolves', async function() {
      client.setNpcSlain.and.returnValue(Promise.resolve({ ok: true }));
      const controller = new SlainConfirmController(onSuccess, 'slain', client);

      await controller.handleConfirm('demo', { id: 7, slain: false }, 'auth-token');

      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
