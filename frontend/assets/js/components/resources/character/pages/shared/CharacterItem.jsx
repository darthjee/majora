import { useEffect, useMemo, useState } from 'react';
import ItemDetailHelper from '../../../item/pages/helpers/ItemDetailHelper.jsx';
import CharacterItemDetailController from '../controllers/CharacterItemDetailController.js';
import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';
import FacadeRefresh from '../../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Shared PC/NPC item detail page component (issue #724): loads a single `CharacterItem` (via
 * {@link CharacterItemDetailController}, which picks between the public and elevated `all.json`
 * endpoint based on the requester's character-level edit permission) and delegates rendering to
 * {@link ItemDetailHelper} — the same helper `GameItem` uses, since the layout is identical for
 * game/PC/NPC items. Mirrors `PlayerDetail`'s loading/error/effect plumbing. Also wires up the
 * photo upload modal (issue #750), gated on the controller's independently-derived
 * `canUploadPhoto` flag, mirroring `GameItem`'s upload modal wiring. Also renders an Edit button,
 * gated on the controller's independently-derived `canEdit` flag (issue #782).
 *
 * @param {object} props - Component props.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @param {Function} [props.ControllerClass] - Item controller class to instantiate, mainly for
 *   tests.
 * @returns {React.ReactElement} Character item detail page element.
 */
export default function CharacterItem({ characterKind, ControllerClass = CharacterItemDetailController }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [canUploadPhoto, setCanUploadPhoto] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const controller = useMemo(
    () => new ControllerClass(characterKind, setItem, setLoading, setError, setCanEdit, setCanUploadPhoto),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [characterKind],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, character_id: characterId } = CharacterItemDetailController
    .getParamsFromHash(characterKind, currentHash);
  const backHref = `#/games/${gameSlug}/${characterKind}/${characterId}/items`;

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  if (loading) return ItemDetailHelper.renderLoading();
  if (error) return ItemDetailHelper.renderError(error);

  const editHref = `#/games/${gameSlug}/${characterKind}/${characterId}/items/${item.id}/edit`;

  return (
    <>
      {ItemDetailHelper.render(item, backHref, editHref, canEdit, canUploadPhoto, () => setShowUploadModal(true))}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={`/games/${gameSlug}/${characterKind}/${characterId}/items/${item.id}/photo_upload.json`}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}
