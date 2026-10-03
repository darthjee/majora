import Translator from '../../../../../i18n/Translator.js';
import StaffPhotoOwner from './StaffPhotoOwner.jsx';

/**
 * One outcome group of the bulk result summary (issue #1474).
 *
 * @param {object} props - Component props.
 * @param {string} props.titleKey - i18n key of the group title.
 * @param {{photo: object, reason: (string|undefined)}[]} props.outcomes - Outcomes of the group.
 * @returns {React.ReactElement|null} Group title and entries, or `null` when empty.
 */
export default function StaffPhotoSummaryGroup({ titleKey, outcomes }) {
  if (outcomes.length === 0) return null;

  return (
    <div className="mb-2">
      <h3 className="h6">{`${Translator.t(titleKey)} (${outcomes.length})`}</h3>
      <ul className="mb-0">
        {outcomes.map(({ photo, reason }) => (
          <li key={photo.id}>
            {`#${photo.id} `}
            <StaffPhotoOwner owner={photo.owner ?? null} />
            {reason ? ` — ${Translator.t(reason)}` : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
