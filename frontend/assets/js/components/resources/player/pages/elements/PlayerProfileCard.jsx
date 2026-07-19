import CardAvatar from '../../../../common/cards/CardAvatar.jsx';

/**
 * Compact, list-style card showing a small kind label, an avatar (falling back to the default
 * character placeholder via `CardAvatar`, same as the roster's `PlayerListItem` cards), and a
 * name. Reused by `PlayerHelper` for both the player's character card and their linked-account
 * card, side by side on the player detail page (issue #695).
 *
 * @param {object} props - Component props.
 * @param {string} props.label - Small caption identifying the card kind (e.g. "Character"/"Player").
 * @param {string|null} [props.photoUrl] - Avatar photo URL, or null/undefined to fall back to
 *   the default placeholder image.
 * @param {string} props.name - Display name, or an empty-state placeholder text when the
 *   underlying entity (character/user) is null.
 * @returns {React.ReactElement} Rendered profile card element.
 */
export default function PlayerProfileCard({ label, photoUrl, name }) {
  return (
    <div className="col-6">
      <div className="card h-100">
        <div className="row g-0 align-items-center">
          <div className="col-4">
            <CardAvatar url={photoUrl} alt={name} />
          </div>
          <div className="col-8">
            <div className="card-body py-2">
              <p className="text-muted small mb-1">{label}</p>
              <h6 className="card-title mb-0">{name}</h6>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
