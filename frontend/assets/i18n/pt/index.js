import common from './common.yaml?raw';

/**
 * Lazy `?raw` chunk loaders for this language's page-specific translation
 * namespaces (everything except `common`), one dynamic import per file —
 * fetched on demand by `TranslationLoader` on a `Translator.t()` miss, never
 * eagerly.
 *
 * @type {object<string, function(): Promise<object>>}
 */
const chunkLoaders = new Proxy({}, {
  get: (target, namespace) => (namespace in target ? target[namespace] : () => (
    // `namespace` is always a `Translator.t()` key's first dot-segment, never
    // user/data input (see docs/agents/i18n.md's `Translator.t()` invariant).
    // eslint-disable-next-line no-unsanitized/method
    import(`./${namespace}.yaml?raw`)
  )),
});

/**
 * Top-level namespace keys bundled inside this language's `common.yaml`
 * chunk, so `TranslationLoader` can route a `commonNamespaces` hit to the
 * `common` chunk instead of a (non-existent) same-named chunk file.
 *
 * @type {string[]}
 */
const commonNamespaces = [
  'header',
  'view_as_modal',
  'login_modal',
  'file_upload_modal',
  'photo_upload_modal',
  'photo_view_modal',
  'photo_card',
  'profile_photo_set_modal',
  'clear_cache_confirm_modal',
  'delete_photo_confirm_modal',
  'kick_confirm_modal',
  'slain_confirm_modal',
  'back_button',
  'pagination',
  'description_box',
  'markdown_editor',
  'character_page',
  'character_status_badges',
  'character_preview_section',
  'language_selector',
  'treasure_exchange_modal',
  'item_exchange_modal',
  'give_item_modal',
  'give_treasure_modal',
  'give_document_modal',
  'document_exchange_modal',
  'possession_exchange_modal',
  'faction_exchange_modal',
  'recruit_modal',
  'game_treasures_page',
  'errors',
];

export default common;
export { chunkLoaders, commonNamespaces };
