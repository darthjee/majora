import BaseCharacterEditHelper from './BaseCharacterEditHelper.jsx';

/**
 * Rendering helper for the PC character edit page.
 *
 * @description Instance of BaseCharacterEditHelper configured for PC characters,
 *   using the 'pc' field ID prefix and 'pc_edit_page' i18n namespace.
 * @type {BaseCharacterEditHelper}
 */
const PcCharacterEditHelper = new BaseCharacterEditHelper('pc', 'pc_edit_page');

export default PcCharacterEditHelper;
