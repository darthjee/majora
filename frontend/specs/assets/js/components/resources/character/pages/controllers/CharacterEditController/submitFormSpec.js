import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { KINDS } from './support.js';

/**
 * Builds the input `fields` object for the "prevents default, resets status/errors, and
 * submits the built fields payload" scenario, threading through the per-kind field values and
 * a single-link array.
 *
 * @param {object} params - Per-kind field values.
 * @param {string} params.name - Character name.
 * @param {string} params.role - Character role.
 * @param {string} params.description - Public description.
 * @param {string} params.privateAllegiance - Private allegiance.
 * @param {string} params.publicAllegiance - Public allegiance.
 * @param {boolean} params.publicSlain - Public slain flag.
 * @param {boolean} params.hidden - Hidden flag.
 * @param {boolean} params.incognito - Incognito flag.
 * @param {object[]} params.links - Links array.
 * @returns {object} `submitForm`'s `fields` argument.
 */
function buildSubmitFields({
  name, role, description, privateAllegiance, publicAllegiance, publicSlain, hidden, incognito, links,
}) {
  return {
    name,
    role,
    description,
    privateDescription: 'Secret notes',
    money: '310',
    privateAllegiance,
    publicAllegiance,
    publicSlain,
    hidden,
    incognito,
    links,
  };
}

/**
 * Builds the expected `RequestStore.mutate` `body` for the same scenario as
 * {@link buildSubmitFields}, including the NPC-only fields when `kind === 'npcs'`.
 *
 * @param {object} params - Per-kind field values.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string} params.name - Character name.
 * @param {string} params.role - Character role.
 * @param {string} params.description - Public description.
 * @param {object[]} params.links - Expected (delete-normalized) links array.
 * @param {string} params.privateAllegiance - Private allegiance.
 * @param {string} params.publicAllegiance - Public allegiance.
 * @param {boolean} params.publicSlain - Public slain flag.
 * @param {boolean} params.hidden - Hidden flag.
 * @param {boolean} params.incognito - Incognito flag.
 * @returns {object} Expected `RequestStore.mutate` call's `body`.
 */
function buildExpectedFields({
  kind, name, role, description, links, privateAllegiance, publicAllegiance, publicSlain, hidden, incognito,
}) {
  const expectedFields = {
    name,
    role,
    public_description: description,
    private_description: 'Secret notes',
    money: 310,
    links,
  };

  if (kind === 'npcs') {
    expectedFields.private_allegiance = privateAllegiance;
    expectedFields.public_allegiance = publicAllegiance;
    expectedFields.public_slain = publicSlain;
    expectedFields.hidden = hidden;
    expectedFields.incognito = incognito;
  }

  return expectedFields;
}

KINDS.forEach(({
  label, Controller, kind, name, role, description, privateAllegiance, publicAllegiance, publicSlain, hidden,
  incognito,
}) => {
  const resource = kind === 'npcs' ? 'npc' : 'pc';

  describe(`${label}#submitForm`, function() {
    let setCharacter;
    let setLoading;
    let setError;
    let setFieldErrors;
    let setStatus;
    let client;
    let characterClient;

    beforeEach(function() {
      setCharacter = jasmine.createSpy('setCharacter');
      setLoading = jasmine.createSpy('setLoading');
      setError = jasmine.createSpy('setError');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      client = jasmine.createSpyObj('client', ['currentHash']);
      characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacter']);
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 2, can_edit: true }),
      }));
    });

    it('prevents default, resets status/errors, and submits the built fields payload', async function() {
      const controller = new Controller(setCharacter, setLoading, setError, setFieldErrors, client, characterClient);
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        const links = [{ id: 5, text: 'Wiki', url: 'https://example.com/wiki', link_type: '' }];

        await controller.submitForm(
          event, 'demo', '2',
          buildSubmitFields({
            name, role, description, privateAllegiance, publicAllegiance, publicSlain, hidden, incognito, links,
          }),
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});

        const expectedLinks = [{
          id: 5, text: 'Wiki', url: 'https://example.com/wiki', link_type: '', delete: false,
        }];
        const expectedFields = buildExpectedFields({
          kind, name, role, description, links: expectedLinks, privateAllegiance, publicAllegiance, publicSlain,
          hidden, incognito,
        });

        expect(RequestStore.mutate).toHaveBeenCalledWith({
          componentName: 'BaseCharacterEditController',
          resource,
          method: 'PATCH',
          quantityType: 'single',
          params: { gameSlug: 'demo', id: '2' },
          body: expectedFields,
          variantName: 'private',
        });
      } finally {
        delete globalThis.window;
      }
    });

    it('does not throw when called without an event', async function() {
      const controller = new Controller(
        setCharacter,
        setLoading,
        setError,
        setFieldErrors,
        client,
        characterClient,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          '2',
          { name, role: '', description: '', privateDescription: '', money: '0' },
          { setStatus, setFieldErrors },
        );

        expect(setStatus).toHaveBeenCalledWith('submitting');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
