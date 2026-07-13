import BaseCharacterEditHelper from './BaseCharacterEditHelper.jsx';

/**
 * Rendering helper for the NPC character edit page.
 *
 * @description Instance of BaseCharacterEditHelper configured for NPC characters,
 *   using the 'npc' field ID prefix and 'npc_edit_page' i18n namespace.
 * @type {BaseCharacterEditHelper}
 */
const NpcCharacterEditHelper = new BaseCharacterEditHelper('npc', 'npc_edit_page');

export default NpcCharacterEditHelper;
