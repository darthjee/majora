import CharacterClient from '../../../../../client/CharacterClient.js';
import UploadClient from '../../../../../client/UploadClient.js';
import GameClient from '../../../../../client/GameClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import PhotoUploadSaga from '../../../../common/base/controllers/PhotoUploadSaga.js';
import Noop from '../../../../../utils/Noop.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Controller for the game NPC creation page.
 */
export default class GameNpcNewController extends BasePageController {
  /**
   * Extract game slug from an NPC creation hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromNpcNewHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/npcs/new', 'game_slug', hash);
  }

  /**
   * Create a game NPC new controller.
   *
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {CharacterClient|null} [characterClient] - Character client override.
   * @param {UploadClient|null} [uploadClient] - Upload client override.
   * @param {Function} [setGameType] - Setter for the containing game's currency type,
   *   used so the money-editing modal renders the right denominations. Optional — a
   *   caller that does not need this display concern may omit it.
   * @param {GameClient|null} [gameClient] - Game client override.
   * @param {Function} [setIsFullEditor] - Setter reporting whether the current viewer is a full
   *   (dm/admin/superuser) creator, as opposed to a reduced-field player/staff creator. Optional —
   *   a caller that does not need this display concern may omit it.
   */
  constructor(
    setError, setFieldErrors = Noop.noop, characterClient = null, uploadClient = null,
    setGameType = Noop.noop, gameClient = null, setIsFullEditor = Noop.noop,
  ) {
    super();
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.characterClient = characterClient ?? new CharacterClient();
    this.uploadClient = uploadClient ?? new UploadClient();
    this.photoUploadSaga = new PhotoUploadSaga(this.uploadClient);
    this.setGameType = setGameType;
    this.gameClient = gameClient ?? new GameClient();
    this.setIsFullEditor = setIsFullEditor;
  }

  /**
   * Build the page mount effect.
   *
   * @description Returns a callback that checks whether the current user may create an NPC at
   *   all (full editor via `can_edit`, or reduced-field creator via `can_create_npc`) and
   *   redirects to the NPCs index when neither is granted, reports which kind of access was
   *   granted via `setIsFullEditor`, and fetches the containing game's currency type for the
   *   money-editing modal.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      const hash = getCurrentHash();
      const gameSlug = GameNpcNewController.getGameSlugFromNpcNewHash(hash);

      AccessStore.ensureGamePermissions(gameSlug)
        .then((permissions) => this.#redirectIfNotAllowed(permissions, gameSlug))
        .catch(() => this.#redirectToNpcs(gameSlug));

      this.fetchGameType(gameSlug, AuthStorage.getToken()).then((gameType) => this.setGameType(gameType));
    };
  }

  /**
   * Fetch the containing game's currency type. Degrades to `'dnd'` when the
   * game fetch fails or the response is not ok, rather than blocking the
   * form.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<string>} Resolves to the game's `game_type`.
   */
  fetchGameType(gameSlug, token) {
    return this.gameClient.fetchGame(gameSlug, token)
      .then((response) => (response.ok ? response.json() : null))
      .then((game) => game?.game_type ?? 'dnd')
      .catch(() => 'dnd');
  }

  /**
   * Submit the new NPC form.
   *
   * @description Prevents the default form submission, resets status and
   *   field errors, sends a POST request through {@link RequestStore.mutate} (issue #830, so
   *   the NPC collection's cached `GET` data is purged on success). On success, redirects
   *   immediately when no photo was picked, or runs the photo upload saga step first when
   *   `formValues.photoFile` is set. On a 400 response, sets field errors. On
   *   any other failure, sets the general error status.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {{name: string, role: string, description: string, privateDescription: string,
   *   hidden: boolean, incognito: boolean, money: string, privateAllegiance: string,
   *   publicAllegiance: string, links: object[], photoFile: File|null}} formValues - Raw form
   *   field values.
   * @param {{setStatus: Function, setFieldErrors: Function, setCharacterId: Function}} setters - Page state setters.
   * @param {boolean} [isFullEditor] - Whether the current viewer is a full (dm/admin/superuser)
   *   creator. Defaults to `true`, so existing callers that don't pass it keep today's
   *   dm/admin/superuser-only behavior. When `true`, submits the full field set to
   *   `.../npcs/full.json`; when `false`, submits the reduced player-writable field set to
   *   `.../npcs.json`.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, gameSlug, formValues, setters, isFullEditor = true) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    const body = isFullEditor
      ? {
        name: formValues.name,
        role: formValues.role,
        public_description: formValues.description,
        private_description: formValues.privateDescription,
        hidden: formValues.hidden,
        incognito: formValues.incognito,
        money: parseInt(formValues.money, 10),
        private_allegiance: formValues.privateAllegiance,
        public_allegiance: formValues.publicAllegiance,
        links: formValues.links ?? [],
      }
      : {
        name: formValues.name,
        role: formValues.role,
        public_description: formValues.description,
        public_allegiance: formValues.publicAllegiance,
        links: formValues.links ?? [],
      };

    try {
      const response = await RequestStore.mutate({
        componentName: 'GameNpcNewController',
        resource: 'npc',
        method: 'POST',
        quantityType: 'collection',
        params: { gameSlug },
        body,
        variantName: isFullEditor ? 'private' : 'regular',
      });

      await this.#handleResponse(response, gameSlug, formValues.photoFile, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  /**
   * Retry the photo upload saga step for an already-created NPC.
   *
   * @description Re-invokes the same upload-only path submitForm runs after
   *   NPC creation, without creating a new NPC. Used by the "retry" action of
   *   the photo-upload-failed UI state.
   * @param {string} gameSlug - Game slug.
   * @param {number|string} characterId - Already-created NPC id.
   * @param {File} photoFile - Photo file to upload.
   * @param {{setStatus: Function, setCharacterId: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the retry handling finishes.
   */
  retryPhotoUpload(gameSlug, characterId, photoFile, setters) {
    return this.#uploadPhoto(gameSlug, characterId, photoFile, setters);
  }

  #redirectIfNotAllowed(permissions, gameSlug) {
    if (!permissions.can_edit && !permissions.can_create_npc) {
      this.#redirectToNpcs(gameSlug);
      return;
    }
    this.setIsFullEditor(Boolean(permissions.can_edit));
  }

  #redirectToNpcs(gameSlug) {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}/npcs`;
    }
  }

  #redirectToNpc(gameSlug, characterId) {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}/npcs/${characterId}`;
    }
  }

  async #handleResponse(response, gameSlug, photoFile, setters) {
    if (response.status === 201) {
      const data = await response.json();

      if (photoFile) {
        await this.#uploadPhoto(gameSlug, data.id, photoFile, setters);
        return;
      }

      this.#redirectToNpc(gameSlug, data.id);
      return;
    }

    const data = await response.json();
    const errors = data.errors ?? {};

    if (response.status === 400) {
      setters.setFieldErrors(errors);
      return;
    }

    setters.setStatus('error');
  }

  async #uploadPhoto(gameSlug, characterId, photoFile, setters) {
    const token = AuthStorage.getToken();
    const uploadPath = await RequestStore.resolvePath({
      resource: 'npc', method: 'POST', quantityType: 'single', params: { gameSlug, id: characterId },
    });
    const ok = await this.photoUploadSaga.upload(uploadPath, photoFile, token);

    if (ok) {
      // Purge before redirecting, so the NPC show page's own `RequestStore.ensure` GET
      // (triggered by the redirect) doesn't re-serve the pre-upload cached character.
      RequestStore.purge({ resource: 'npc' });
      this.#redirectToNpc(gameSlug, characterId);
      return;
    }

    this.#failPhotoUpload(characterId, setters);
  }

  #failPhotoUpload(characterId, setters) {
    setters.setCharacterId(characterId);
    setters.setStatus('photo-upload-failed');
  }
}
