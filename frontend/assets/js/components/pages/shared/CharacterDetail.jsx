import { useEffect, useMemo, useState } from 'react';
import CharacterHelper from '../helpers/CharacterHelper.jsx';
import AuthEvents from '../../../utils/AuthEvents.js';
import PhotoUploadModal from '../../elements/PhotoUploadModal.jsx';

/**
 * Default extension hook, used when a character kind has no extra
 * behaviour to plug into the detail page (e.g. PCs, which have no slain modal).
 *
 * @returns {{handlers: object, modal: null}} Empty extension result.
 */
function useNoExtra() {
  return { handlers: {}, modal: null };
}

/**
 * Shared character detail page component.
 *
 * @description Accepts a type-specific controller class, hash param extractor, and
 *   character kind as props, so NPC and PC detail pages can share identical logic.
 *   NPC-only behaviour (the slain confirm modal) plugs in via the `useExtra` hook prop,
 *   which returns extra render handlers (merged into {@link CharacterHelper#render}'s
 *   handlers) and an extra modal element, without forcing PC to carry unused slain logic.
 * @param {object} props - Component props.
 * @param {Function} props.ControllerClass - Detail controller class to instantiate.
 * @param {Function} props.getParamsFromHash - Hash-parsing function for this character type.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @param {Function} [props.useExtra] - Extension hook returning `{handlers, modal}`,
 *   invoked with `(character, controller)`.
 * @returns {React.ReactElement} Character detail page element.
 */
export default function CharacterDetail({
  ControllerClass, getParamsFromHash, characterKind, useExtra = useNoExtra,
}) {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const controller = useMemo(
    () => new ControllerClass(setCharacter, setLoading, setError),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    const handleAuthChanged = () => controller.buildEffect()();
    AuthEvents.subscribe(handleAuthChanged);
    return () => AuthEvents.unsubscribe(handleAuthChanged);
  }, [controller]);

  const { handlers: extraHandlers, modal: extraModal } = useExtra(character, controller);

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug } = getParamsFromHash(currentHash);
  const backHref = `#/games/${gameSlug}/${characterKind}`;

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  if (loading) return CharacterHelper.renderLoading();
  if (error) return CharacterHelper.renderError(error);

  return (
    <>
      {CharacterHelper.render(character, backHref, {
        onOpenUploadModal: () => setShowUploadModal(true),
        ...extraHandlers,
      })}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={`/games/${gameSlug}/${characterKind}/${character.id}/photo_upload.json`}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
      {extraModal}
    </>
  );
}
