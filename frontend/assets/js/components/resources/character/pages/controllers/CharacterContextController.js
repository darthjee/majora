import CharacterClient from '../../../../../client/CharacterClient.js';
import GameClient from '../../../../../client/GameClient.js';
import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import CharacterGameTypeResolver from './CharacterGameTypeResolver.js';

/**
 * Controller resolving a PC or NPC's character context (base fields, own-game currency type,
 * and both character-level and game-level edit permissions) for the character treasures index
 * page — the "Add treasure" button and the treasure exchange modal both need this context, kept
 * page-level and independent of the treasures grid itself, which now fetches through the shared
 * `ListPage`/`listTypeConfig` abstraction (`pc-treasures`/`npc-treasures`) instead. Extracted
 * from the former `BaseCharacterTreasuresController`, keeping only its character-context half.
 */
export default class CharacterContextController extends BasePageController {
  #mounted = false;

  /**
   * Create a character context controller.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {Function} setCharacter - Character context setter.
   * @param {GenericClient|null} [client] - Client override, mainly for tests.
   * @param {CharacterClient|null} [characterClient] - Character client override, mainly for tests.
   * @param {GameClient|null} [gameClient] - Game client override, mainly for tests.
   */
  constructor(
    characterKind, setCharacter, client = null, characterClient = null, gameClient = null,
  ) {
    super();
    this.characterKind = characterKind;
    this.setCharacter = setCharacter;
    this.client = client ?? new GenericClient();
    this.characterClient = characterClient ?? new CharacterClient();
    this.gameClient = gameClient ?? new GameClient();
    this.#mounted = true;
  }

  /**
   * Build page loading effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const { game_slug: gameSlug, character_id: characterId } = this.#getParams();

      if (gameSlug && characterId) {
        this.#fetchCharacterData(gameSlug, characterId, safeSet);
      }

      return () => {
        mounted = false;
        this.#mounted = false;
      };
    };
  }

  /**
   * Re-fetch and re-set the character context, without touching the treasures grid (owned by
   * `ListPage`). Meant to be called after a successful acquire/sell so the character's money
   * (and any other field) reflects a fresh server read, independent of the effect built by
   * {@link buildEffect}.
   *
   * @returns {void}
   */
  refreshCharacter() {
    const { game_slug: gameSlug, character_id: characterId } = this.#getParams();

    if (!gameSlug || !characterId) {
      return;
    }

    this.#fetchCharacterData(gameSlug, characterId, this.buildSafeSetter(() => this.#mounted));
  }

  #getParams() {
    return BasePageController.extractParams(
      `/games/:game_slug/${this.characterKind}/:character_id/treasures`,
      this.client.currentHash(),
      ['game_slug', 'character_id'],
    );
  }

  #fetchCharacterData(gameSlug, characterId, safeSet) {
    const token = AuthStorage.getToken();

    this.characterClient.fetchCharacter(this.characterKind, gameSlug, characterId, token)
      .then((response) => (response.ok ? response.json() : null))
      .then((character) => this.#mergeGameType(character, gameSlug, token))
      .then((character) => this.#mergeAccess(character, gameSlug, characterId, safeSet))
      .catch(() => safeSet(this.setCharacter, null));
  }

  #mergeGameType(character, gameSlug, token) {
    if (!character) {
      return character;
    }

    return CharacterGameTypeResolver.merge(character, this.gameClient.fetchGame(gameSlug, token));
  }

  /**
   * Merge both the character-level and game-level edit permissions onto the loaded character
   * before publishing it: `can_edit` (character-level, `true` for the DM, a superuser, or — for
   * a PC — the character's own owning player) gates the "Add treasure" button, while
   * `game_can_edit` (game-level, DM/superuser only) drives the treasure exchange modal's choice
   * between the public and `all.json` endpoints. Resolved in parallel to avoid an extra
   * sequential round-trip. Each check falls back to `false` independently if it fails.
   *
   * @param {object|null} character - Character payload, or `null` if it failed to load.
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {Function} safeSet - Setter wrapper guarding against a stale/unmounted update.
   * @returns {Promise<void>} Resolves once the character (with merged permissions) is set.
   */
  #mergeAccess(character, gameSlug, characterId, safeSet) {
    if (!character) {
      safeSet(this.setCharacter, null);
      return Promise.resolve();
    }

    const characterPermissions = AccessStore.ensureCharacterPermissions(this.characterKind, gameSlug, characterId)
      .then((permissions) => Boolean(permissions.can_edit))
      .catch(() => false);
    const gamePermissions = AccessStore.ensureGamePermissions(gameSlug)
      .then((permissions) => Boolean(permissions.can_edit))
      .catch(() => false);

    return Promise.all([characterPermissions, gamePermissions])
      .then(([canEdit, gameCanEdit]) => safeSet(
        this.setCharacter, { ...character, can_edit: canEdit, game_can_edit: gameCanEdit },
      ));
  }
}
