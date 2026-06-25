import { useEffect, useMemo, useState } from 'react';
import PcCharacterEditController, { getPcCharacterEditParamsFromHash }
  from './controllers/PcCharacterEditController.js';
import PcCharacterEditHelper from './helpers/PcCharacterEditHelper.jsx';
import CharacterHelper from './helpers/CharacterHelper.jsx';

/**
 * PC character edit page.
 *
 * @returns {React.ReactElement} PC character edit page element.
 */
export default function PcCharacterEdit() {
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
    () => new PcCharacterEditController(setCharacter, setLoading, setError, setFieldErrors),
    [],
  );

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug, character_id: characterId } = getPcCharacterEditParamsFromHash(currentHash);

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
  if (!character || !character.can_edit) return PcCharacterEditHelper.renderLoading();

  return PcCharacterEditHelper.render(
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
