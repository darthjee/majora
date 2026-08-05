import LinksFieldHelper from './helpers/LinksFieldHelper.jsx';

/**
 * Editable links field shared by character (PC/NPC) and game edit pages: a read-only `LinkList`
 * preview (filtering out entries marked for deletion) followed by a button opening the links
 * edit modal.
 *
 * @param {object} props - Component props.
 * @param {object[]} [props.links] - Current links array. Entries with `delete: true` are
 *   filtered out of the visible list (kept so the edit modal can restore them).
 * @param {string} props.buttonLabel - Translated "Edit links" button label.
 * @param {Function} props.onOpenLinksModal - Handler invoked when the button is clicked.
 * @returns {React.ReactElement} Links field element.
 */
export default function LinksField({ links = [], buttonLabel, onOpenLinksModal }) {
  return LinksFieldHelper.render(links, buttonLabel, onOpenLinksModal);
}
