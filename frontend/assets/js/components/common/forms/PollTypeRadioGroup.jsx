import Translator from '../../../i18n/Translator.js';

const POLL_TYPES = ['single', 'multiple'];

/**
 * Renders the single/multiple poll-type radio pair, shared by `GamePollNewHelper` and
 * `CreateSessionPollModalHelper`. Each caller supplies its own id prefix, input `name`
 * (for native radio grouping), and i18n key prefix, since the two callers use distinct
 * translation namespaces (`game_poll_new_page.type_*` / `session_poll_modal.type_*`).
 *
 * @param {object} props - Component props.
 * @param {string} props.idPrefix - Prefix for each radio's `id` (`${idPrefix}-${type}`).
 * @param {string} props.name - `name` attribute shared by both radios, for native grouping.
 * @param {string} props.translationPrefix - i18n key prefix for each option's label
 *   (`Translator.t(`${translationPrefix}_${type}`)`).
 * @param {string} props.value - Currently selected poll type (`'single'` or `'multiple'`).
 * @param {Function} props.onChange - Called with the newly selected type.
 * @returns {React.ReactElement} Rendered radio pair.
 */
export default function PollTypeRadioGroup({ idPrefix, name, translationPrefix, value, onChange }) {
  return (
    <>
      {POLL_TYPES.map((type) => (
        <div className="form-check form-check-inline" key={type}>
          <input
            id={`${idPrefix}-${type}`}
            type="radio"
            className="form-check-input"
            name={name}
            value={type}
            checked={value === type}
            onChange={() => onChange(type)}
          />
          <label className="form-check-label" htmlFor={`${idPrefix}-${type}`}>
            {Translator.t(`${translationPrefix}_${type}`)}
          </label>
        </div>
      ))}
    </>
  );
}
