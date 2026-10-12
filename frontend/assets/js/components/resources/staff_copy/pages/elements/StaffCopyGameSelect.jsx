import Translator from '../../../../../i18n/Translator.js';

/**
 * Builds the option label of a game: its name plus its joined domain groups in parentheses.
 *
 * @param {{name: string, domain_groups?: string[]}} game - The game.
 * @returns {string} Option label, e.g. `Dragon Hunt (main, beta)`.
 */
export function gameOptionLabel({ name, domain_groups: groups = [] }) {
  return groups.length > 0 ? `${name} (${groups.join(', ')})` : name;
}

/**
 * Game selector of the staff copy page, used for both the source and the target game.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Select element id.
 * @param {string} props.labelKey - i18n key of the field label.
 * @param {{slug: string, name: string, domain_groups: string[]}[]} props.games - Games.
 * @param {string} props.value - Selected game slug (`''` when none).
 * @param {boolean} [props.disabled] - Whether the select is disabled (copy run in progress).
 * @param {Function} props.onChange - Called with the selected slug (`''` for the placeholder).
 * @returns {React.ReactElement} Labelled select.
 */
export default function StaffCopyGameSelect({
  id, labelKey, games, value, disabled = false, onChange,
}) {
  return (
    <div className="col-md-6">
      <label htmlFor={id} className="form-label">{Translator.t(labelKey)}</label>
      <select
        id={id}
        className="form-select"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{Translator.t('staff_copies_page.select_placeholder')}</option>
        {games.map((game) => <option key={game.slug} value={game.slug}>{gameOptionLabel(game)}</option>)}
      </select>
    </div>
  );
}
