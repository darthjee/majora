import { useEffect, useMemo, useState } from 'react';
import FactionCharactersPanelController from './controllers/FactionCharactersPanelController.js';
import FactionCharactersPanelHelper from './helpers/FactionCharactersPanelHelper.jsx';

/**
 * Faction show page's right-column character-list panel (issue #943): a real, URL-hash-synced
 * pagination over the faction's characters (`GET /factions/:id/characters.json`, or `/all.json`
 * for DM/admin, picked automatically by `RequestStore`'s own permission resolution) — "similar to
 * `ShortList`, but not the same": no item cap, no "see all" link, closer in shape to a full
 * resource list page's card grid (e.g. `GameFactions.jsx`) embedded inside this show page's
 * column. Also (issue #1106) owns the per-row kick control: which character is pending
 * confirmation, submission state, and the resulting kick request — a successful kick purges the
 * faction cache and re-triggers this panel's own fetch directly (mirroring `GameFaction.jsx`'s
 * `handleUploadSuccess`), independently of the `refreshToken` prop bumped by the recruit modal.
 *
 * @param {object} props - Component props, the page's merged `ShowPageLayout` rendering context
 *   spread in (`game_slug`, `id`, `name`, ...).
 * @param {string} props.game_slug - Game slug.
 * @param {number|string} props.id - The `GameFaction`'s own id.
 * @param {string} [props.name] - The `GameFaction`'s own name, used in the kick confirmation
 *   modal's message.
 * @param {number} [props.refreshToken] - Opaque value bumped to re-trigger the panel's fetch
 *   (e.g. after a successful recruit).
 * @returns {React.ReactElement} Rendered faction character-list panel.
 */
export default function FactionCharactersPanel({
  game_slug: gameSlug, id: factionId, name: factionName, refreshToken = 0,
}) {
  const [state, setState] = useState({
    items: [], pagination: { page: 1, pages: 1, perPage: 24 }, isDmOrAdmin: false, loading: true, error: '',
  });
  const [kickTarget, setKickTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [kickError, setKickError] = useState('');

  const controller = useMemo(() => new FactionCharactersPanelController(), []);
  const reload = () => controller.buildEffect(gameSlug, factionId, setState)();

  useEffect(() => reload(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controller, gameSlug, factionId, refreshToken]);

  const handleKickClick = (character) => {
    setKickTarget(character);
    setKickError('');
  };

  const handleKickCancel = () => {
    setKickTarget(null);
    setKickError('');
  };

  const handleKickConfirm = () => controller.confirmKick(
    kickTarget, gameSlug, factionId, state.isDmOrAdmin,
    {
      setSubmitting,
      setError: setKickError,
      onSuccess: () => {
        setKickTarget(null);
        reload();
      },
    },
  );

  return FactionCharactersPanelHelper.render(
    state, gameSlug, factionId,
    {
      target: kickTarget, factionName, submitting, error: kickError,
    },
    {
      onKick: handleKickClick, onConfirm: handleKickConfirm, onCancel: handleKickCancel,
    },
  );
}
