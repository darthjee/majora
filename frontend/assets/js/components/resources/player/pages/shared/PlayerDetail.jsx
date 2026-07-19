import { useEffect, useMemo, useState } from 'react';
import PlayerHelper from '../helpers/PlayerHelper.jsx';
import PlayerController from '../controllers/PlayerController.js';
import PlayerConversationsController, { CONV_PAGE_PARAM } from '../controllers/PlayerConversationsController.js';
import FacadeRefresh from '../../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Shared player detail page component (issue #695): loads the player (character/user cards, via
 * {@link PlayerController}) and their paginated shared conversations (via
 * {@link PlayerConversationsController}), then delegates rendering to {@link PlayerHelper}.
 * Mirrors `CharacterDetail`'s loading/error/effect/back-link plumbing, without the PC/NPC
 * photo-upload/money-modal extras, which don't apply to players.
 *
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Player controller class to instantiate, mainly
 *   for tests.
 * @param {Function} [props.ConversationsControllerClass] - Conversations controller class to
 *   instantiate, mainly for tests.
 * @returns {React.ReactElement} Player detail page element.
 */
export default function PlayerDetail({
  ControllerClass = PlayerController,
  ConversationsControllerClass = PlayerConversationsController,
}) {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [conversations, setConversations] = useState([]);
  const [conversationsPagination, setConversationsPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState('');

  const controller = useMemo(
    () => new ControllerClass(setPlayer, setLoading, setError),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const conversationsController = useMemo(
    () => new ConversationsControllerClass(
      setConversations, setConversationsPagination, setConversationsLoading, setConversationsError,
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => conversationsController.buildEffect()(), [conversationsController]);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, id } = PlayerController.getPlayerParamsFromHash(currentHash);
  const backHref = `#/games/${gameSlug}/players`;
  const basePath = `#/games/${gameSlug}/players/${id}`;

  if (loading) return PlayerHelper.renderLoading();
  if (error) return PlayerHelper.renderError(error);

  return PlayerHelper.render(player, backHref, {
    basePath,
    pageParam: CONV_PAGE_PARAM,
    conversations,
    pagination: conversationsPagination,
    loading: conversationsLoading,
    error: conversationsError,
  });
}
