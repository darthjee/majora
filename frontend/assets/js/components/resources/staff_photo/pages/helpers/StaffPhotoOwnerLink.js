/**
 * Builds a game-scoped owner href builder for the given sub-path.
 *
 * @param {string} segment - Path segment under the game (e.g. `factions`).
 * @returns {Function} Builder taking `(owner, slug)` and returning the href.
 */
const gameScoped = (segment) => (owner, slug) => `#/games/${slug}/${segment}/${owner.id}`;

/**
 * Builds a top-level (non game-scoped) owner href builder for the given path prefix.
 *
 * @param {string} prefix - Path prefix (e.g. `miniatures/stl_models`).
 * @returns {Function} Builder taking `owner` and returning the href.
 */
const topLevel = (prefix) => (owner) => `#/${prefix}/${owner.id}`;

const GAME_SCOPED_BUILDERS = {
  game: (_owner, slug) => `#/games/${slug}`,
  game_faction: gameScoped('factions'),
  game_item: gameScoped('items'),
  game_common_item: gameScoped('common_items'),
  game_document: gameScoped('documents'),
  game_possession: gameScoped('possessions'),
  character: (owner, slug) => `#/games/${slug}/${owner.kind === 'pc' ? 'pcs' : 'npcs'}/${owner.id}`,
  treasure: gameScoped('treasures'),
};

const GAMELESS_BUILDERS = {
  treasure: topLevel('treasures'),
  stl_model: topLevel('miniatures/stl_models'),
  source: topLevel('miniatures/sources'),
  collection: topLevel('miniatures/collections'),
};

/**
 * Builds the link to a staff photo's owner page.
 *
 * @description Looks the owner type up in a type-to-builder map: game-scoped types
 *   (`game`, `game_faction`, `game_item`, `game_common_item`, `game_document`,
 *   `game_possession`, `character`, `treasure`) link under `#/games/:slug/...` when the owner
 *   carries a game; `treasure` without a game and the miniatures types (`stl_model`, `source`,
 *   `collection`) link to their top-level pages. `character_item`, `game_document_file`,
 *   unknown types and game-scoped owners without a game render as plain text (`href: null`).
 *   A `null` owner must be handled by the caller (orphan label).
 * @param {{type: string, id: number, name: string, kind: (string|undefined),
 *   game: ({slug: string, name: string}|null)}} owner - The photo's owner.
 * @returns {{href: (string|null), text: string}} The owner link, `href` being `null` for plain
 *   text.
 */
export default function buildStaffPhotoOwnerLink(owner) {
  const slug = owner.game?.slug;
  const gameBuilder = GAME_SCOPED_BUILDERS[owner.type];
  const gamelessBuilder = GAMELESS_BUILDERS[owner.type];
  let href = null;

  if (slug && gameBuilder) {
    href = gameBuilder(owner, slug);
  } else if (!owner.game && gamelessBuilder) {
    href = gamelessBuilder(owner);
  }

  return { href, text: owner.name };
}
