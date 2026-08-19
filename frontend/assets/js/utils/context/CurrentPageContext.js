/**
 * Pure `state -> context` builder, turning a header-style state object (`route`,
 * `gameAccess`, `loggedIn`, etc.) into a flat rendering context: every raw field is
 * passed through unchanged, plus a handful of derived boolean flags that would
 * otherwise be recomputed ad hoc, inline, by each caller. Has no I/O of its own — it
 * never fetches anything or reaches into `AccessStore`, it only derives from the
 * `state` it is handed — which keeps it dependency-free and reusable outside the
 * header later, even though `HeaderHelper`/`HeaderNavHelper` are its only callers today.
 */
export default class CurrentPageContext {
  /**
   * Builds the rendering context for `state`.
   *
   * @param {{route: ({page: (string|undefined), gameSlug: (string|undefined), characterId: (string|undefined)}|undefined), gameAccess: ({is_dm: boolean, is_player: boolean, is_superuser: boolean, is_staff: boolean}|undefined)}} state - Raw state to derive the context from.
   * @returns {object} `state`'s own fields, plus `isGamePage`, `isPcPage`, `isNpcPage`,
   *   and `hasGameAccess` derived flags.
   */
  static build(state) {
    return {
      ...state,
      isGamePage: Boolean(state.route?.gameSlug),
      isPcPage: Boolean(state.route?.page?.startsWith('pcCharacter')),
      isNpcPage: Boolean(state.route?.page?.startsWith('npcCharacter')),
      hasGameAccess: CurrentPageContext.#hasGameAccess(state.gameAccess),
    };
  }

  /**
   * Derives whether `gameAccess` grants any role (DM, player, superuser, staff).
   *
   * @param {{is_dm: boolean, is_player: boolean, is_superuser: boolean, is_staff: boolean}|undefined} gameAccess - Game-level access flags, or `undefined` when unresolved.
   * @returns {boolean} `true` when any role flag is set.
   */
  static #hasGameAccess(gameAccess) {
    return Boolean(
      gameAccess?.is_dm || gameAccess?.is_player || gameAccess?.is_superuser || gameAccess?.is_staff,
    );
  }
}
