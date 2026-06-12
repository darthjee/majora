/**
 * Character info panel: name, class, level, and description.
 *
 * @param {object} props - Component props.
 * @param {string} props.name - Character name.
 * @param {string} [props.character_class] - Character class.
 * @param {number|null} [props.level] - Character level.
 * @param {string} [props.description] - Character description.
 * @returns {React.ReactElement} Character info element.
 */
export default function CharacterInfo({ name, character_class, level, description }) {
  return (
    <div className="col-md-8">
      <h1>{name}</h1>
      {character_class && (
        <p className="text-muted mb-1">
          <strong>Class:</strong> {character_class}
          {level !== null && level !== undefined && <span> &mdash; Level {level}</span>}
        </p>
      )}
      {description && (
        <p className="mt-3">{description}</p>
      )}
    </div>
  );
}
