import { useEffect, useMemo, useState } from 'react';
import CharacterHelper from '../helpers/CharacterHelper.jsx';

/**
 * Shared character edit page component.
 *
 * @description Accepts type-specific controller class, hash param extractor, and
 *   edit helper instance as props, so NPC and PC edit pages can share identical logic.
 * @param {object} props - Component props.
 * @param {Function} props.ControllerClass - Edit controller class to instantiate.
 * @param {Function} props.getParamsFromHash - Hash-parsing function for this character type.
 * @param {import('../helpers/BaseCharacterEditHelper.jsx').default} props.EditHelper - Edit helper instance
 *   with `render` and `renderLoading` methods.
 * @returns {React.ReactElement} Character edit page element.
 */
export default function CharacterEdit({ ControllerClass, getParamsFromHash, EditHelper }) {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [characterClass, setCharacterClass] = useState('');
  const [level, setLevel] = useState('');
  const [description, setDescription] = useState('');
  const [privateDescription, setPrivateDescription] = useState('');

  const controller = useMemo(
    () => new ControllerClass(setCharacter, setLoading, setError, setFieldErrors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug, character_id: characterId } = getParamsFromHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    controller.applyLoadedCharacter(character, gameSlug, characterId, {
      setName,
      setAvatarUrl,
      setCharacterClass,
      setLevel,
      setDescription,
      setPrivateDescription,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    characterId,
    { name, avatarUrl, characterClass, level, description, privateDescription },
    { setStatus, setFieldErrors },
  );

  if (loading) return CharacterHelper.renderLoading();
  if (error) return CharacterHelper.renderError(error);
  if (!character || !character.can_edit) return EditHelper.renderLoading();

  return EditHelper.render(
    {
      name,
      avatar_url: avatarUrl,
      character_class: characterClass,
      level,
      description,
      privateDescription,
      status,
      fieldErrors,
    },
    {
      onSubmit: handleSubmit,
      onNameChange: (event) => setName(event.target.value),
      onAvatarUrlChange: (event) => setAvatarUrl(event.target.value),
      onCharacterClassChange: (event) => setCharacterClass(event.target.value),
      onLevelChange: (event) => setLevel(event.target.value),
      onDescriptionChange: (event) => setDescription(event.target.value),
      onPrivateDescriptionChange: (event) => setPrivateDescription(event.target.value),
    }
  );
}
