import { useEffect, useMemo, useState } from 'react';
import NpcCharacterEditController, { getNpcCharacterEditParamsFromHash }
  from './controllers/NpcCharacterEditController.js';
import NpcCharacterEditHelper from './helpers/NpcCharacterEditHelper.jsx';
import CharacterHelper from './helpers/CharacterHelper.jsx';

/**
 * NPC character edit page.
 *
 * @returns {React.ReactElement} NPC character edit page element.
 */
export default function NpcCharacterEdit() {
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

  const controller = useMemo(
    () => new NpcCharacterEditController(setCharacter, setLoading, setError, setFieldErrors),
    [],
  );

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug, character_id: characterId } = getNpcCharacterEditParamsFromHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    controller.applyLoadedCharacter(character, gameSlug, characterId, {
      setName,
      setAvatarUrl,
      setCharacterClass,
      setLevel,
      setDescription,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    characterId,
    { name, avatarUrl, characterClass, level, description },
    { setStatus, setFieldErrors },
  );

  if (loading) return CharacterHelper.renderLoading();
  if (error) return CharacterHelper.renderError(error);
  if (!character || !character.can_edit) return NpcCharacterEditHelper.renderLoading();

  return NpcCharacterEditHelper.render(
    {
      name,
      avatar_url: avatarUrl,
      character_class: characterClass,
      level,
      description,
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
    }
  );
}
