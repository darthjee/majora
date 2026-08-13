import { useEffect, useMemo, useState } from 'react';
import PossessionDetailHelper from '../../../possession/pages/helpers/PossessionDetailHelper.jsx';
import CharacterPossessionDetailController from '../controllers/CharacterPossessionDetailController.js';
import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import resourceConfig from '../../../../../utils/requests/resourceConfig.js';
import FacadeRefresh from '../../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Shared PC/NPC possession detail page component (issue #1076): loads a single
 * `CharacterPossession` (via {@link CharacterPossessionDetailController}) and delegates rendering
 * to `PossessionDetailHelper` — the same helper `GamePossession` uses, since the layout is
 * identical. Copies `CharacterItem.jsx`'s structure (Edit button + `PhotoUploadModal` +
 * `RequestStore.purge`) but, unlike `CharacterItem.jsx`, builds `uploadPath` against the
 * underlying `GamePossession`'s own id (`possession.game_possession_id`), not a character-scoped
 * id pair, matching `GamePossession.jsx`'s own photo-replace wiring — `CharacterPossession` has no
 * photo of its own to override (see the main plan's "Attribute delegation model"). `editHref`
 * still points at this character's own possession edit route (`possession.id`, the
 * `CharacterPossession`'s own id), which internally resolves the `GamePossession` id itself before
 * submitting.
 *
 * @param {object} props - Component props.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @param {Function} [props.ControllerClass] - Possession controller class to instantiate, mainly
 *   for tests.
 * @returns {React.ReactElement} Character possession detail page element.
 */
export default function CharacterPossession({ characterKind, ControllerClass = CharacterPossessionDetailController }) {
  const [possession, setPossession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [canUploadPhoto, setCanUploadPhoto] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const controller = useMemo(
    () => new ControllerClass(characterKind, setPossession, setLoading, setError, setCanEdit, setCanUploadPhoto),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [characterKind],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, character_id: characterId } = CharacterPossessionDetailController
    .getParamsFromHash(characterKind, currentHash);
  const backHref = `#/games/${gameSlug}/${characterKind}/${characterId}/possessions`;

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    // Purge before refetching: the photo upload saga doesn't go through `RequestStore.mutate`
    // (it's a two-step, non-JSON-body saga), so the cache purge must happen explicitly here,
    // mirroring `CharacterItem.jsx`'s own `handleUploadSuccess`.
    RequestStore.purge({ resource: 'possession' });
    controller.buildEffect()();
  };

  if (loading) return PossessionDetailHelper.renderLoading();
  if (error) return PossessionDetailHelper.renderError(error);

  const editHref = `#/games/${gameSlug}/${characterKind}/${characterId}/possessions/${possession.id}/edit`;
  const uploadPath = resourceConfig.get('POST', 'possession', 'single').regular.path({
    gameSlug, id: possession.game_possession_id,
  });

  return (
    <>
      {PossessionDetailHelper.render(
        possession, backHref, editHref, canEdit, canUploadPhoto, () => setShowUploadModal(true),
      )}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={uploadPath}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}
