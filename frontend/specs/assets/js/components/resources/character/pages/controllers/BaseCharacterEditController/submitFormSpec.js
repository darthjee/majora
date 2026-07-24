import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { TestCharacterEditController, buildContext } from './support.js';

describe('BaseCharacterEditController', function() {
  let setCharacter;
  let setLoading;
  let setError;
  let setFieldErrors;
  let client;
  let characterClient;

  beforeEach(function() {
    ({ setCharacter, setLoading, setError, setFieldErrors, client, characterClient } = buildContext());
  });

  describe('#submitForm', function() {
    let setStatus;

    beforeEach(function() {
      setStatus = jasmine.createSpy('setStatus');
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        ok: true, status: 200, json: () => Promise.resolve({ id: 1, can_edit: true }),
      }));
    });

    it('prevents default, resets status/errors, and submits the built fields payload', async function() {
      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event, 'demo', '1',
          {
            name: 'Test Hero',
            role: 'Fighter',
            description: 'A brave hero', privateDescription: 'DM notes',
            money: '310',
            allegiance: 'ally',
            publicAllegiance: 'enemy',
            publicSlain: true,
            hidden: true,
            links: [
              { id: 12, text: 'Loot table', url: 'https://example.com/loot', link_type: 'lootstudio' },
              { text: '', url: 'https://example.com/new-link', link_type: '' },
              { id: 7, text: 'Old', url: 'https://example.com/old', delete: true },
            ],
          },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(RequestStore.mutate).toHaveBeenCalledWith({
          componentName: 'BaseCharacterEditController',
          resource: 'npc',
          method: 'PATCH',
          quantityType: 'single',
          params: { gameSlug: 'demo', id: '1' },
          variantName: 'private',
          body: {
            name: 'Test Hero',
            role: 'Fighter',
            public_description: 'A brave hero', private_description: 'DM notes',
            money: 310,
            allegiance: 'ally',
            public_allegiance: 'enemy',
            public_slain: true,
            hidden: true,
            links: [
              {
                id: 12, text: 'Loot table', url: 'https://example.com/loot', link_type: 'lootstudio', delete: false,
              },
              { text: 'https://example.com/new-link', url: 'https://example.com/new-link', link_type: '', delete: false },
              {
                id: 7, text: 'Old', url: 'https://example.com/old', link_type: '', delete: true,
              },
            ],
          },
        });
      } finally {
        delete globalThis.window;
      }
    });

    it('sets per-field errors on a 400 response without redirecting', async function() {
      RequestStore.mutate.and.returnValue(Promise.resolve({
        ok: false, status: 400,
        json: () => Promise.resolve({ errors: { role: ['is invalid'] } }),
      }));

      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined, 'demo', '1',
          { name: '', role: '', description: '', privateDescription: '' },
          { setStatus, setFieldErrors },
        );

        expect(setFieldErrors).toHaveBeenCalledWith({ role: ['is invalid'] });
        expect(setError).not.toHaveBeenCalled();
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to error on a non-400 failure response without redirecting', async function() {
      RequestStore.mutate.and.returnValue(Promise.resolve({
        ok: false, status: 500,
        json: () => Promise.resolve({ errors: {} }),
      }));

      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined, 'demo', '1',
          { name: '', role: '', description: '', privateDescription: '' },
          { setStatus, setFieldErrors },
        );

        expect(setStatus).toHaveBeenCalledWith('error');
        expect(setError).not.toHaveBeenCalled();
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to error when the request throws', async function() {
      RequestStore.mutate.and.returnValue(Promise.reject(new Error('network')));

      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );

      await controller.submitForm(
        undefined, 'demo', '1',
        { name: '', role: '', description: '', privateDescription: '' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(setError).not.toHaveBeenCalled();
    });

    describe('when isFullEditor is false (player-only NPC editor)', function() {
      it('PATCHes the reduced fields payload with the regular (player-writable) variant', async function() {
        const controller = new TestCharacterEditController(
          setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
        );
        const event = jasmine.createSpyObj('event', ['preventDefault']);
        const fakeWindow = { location: { hash: '' } };
        globalThis.window = fakeWindow;

        try {
          await controller.submitForm(
            event, 'demo', '1',
            {
              name: 'Grumbleknuckle',
              role: 'Shopkeeper',
              description: 'A brave hero', privateDescription: 'Ignored DM notes',
              money: '999',
              allegiance: 'ally',
              publicAllegiance: 'enemy',
              publicSlain: true,
              links: [
                { id: 12, text: 'Loot table', url: 'https://example.com/loot', link_type: 'lootstudio' },
              ],
            },
            { setStatus, setFieldErrors },
            false,
          );

          expect(RequestStore.mutate).toHaveBeenCalledWith({
            componentName: 'BaseCharacterEditController',
            resource: 'npc',
            method: 'PATCH',
            quantityType: 'single',
            params: { gameSlug: 'demo', id: '1' },
            variantName: 'regular',
            body: {
              name: 'Grumbleknuckle',
              role: 'Shopkeeper',
              public_description: 'A brave hero',
              allegiance: 'enemy',
              links: [
                {
                  id: 12, text: 'Loot table', url: 'https://example.com/loot', link_type: 'lootstudio', delete: false,
                },
              ],
              slain: true,
            },
          });
        } finally {
          delete globalThis.window;
        }
      });
    });
  });
});
