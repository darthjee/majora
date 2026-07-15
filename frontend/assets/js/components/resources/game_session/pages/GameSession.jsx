import { useEffect, useMemo, useState } from 'react';
import GameSessionController from './controllers/GameSessionController.js';
import SessionMessagesController from './controllers/SessionMessagesController.js';
import GameSessionClient from '../../../../client/GameSessionClient.js';
import AuthStorage from '../../../../utils/auth/AuthStorage.js';
import GameSessionHelper from './helpers/GameSessionHelper.jsx';

/**
 * Game session detail page.
 *
 * @returns {React.ReactElement} Game session detail page element.
 */
export default function GameSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [messages, setMessages] = useState([]);
  const [nextEntryId, setNextEntryId] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const controller = useMemo(
    () => new GameSessionController(setSession, setLoading, setError),
    [],
  );

  const messagesController = useMemo(
    () => new SessionMessagesController(setMessages, setNextEntryId, setLoadingMore),
    [],
  );

  const client = useMemo(() => new GameSessionClient(), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    if (!session) return;
    messagesController.loadFirstPage(session.game_slug, session.id);
  }, [messagesController, session]);

  if (loading) return GameSessionHelper.renderLoading();
  if (error) return GameSessionHelper.renderError(error);

  const handleLoadMore = () => messagesController.loadMore(
    session.game_slug, session.id, messages, nextEntryId,
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    setPosting(true);
    setFieldErrors({});

    const token = AuthStorage.getToken();

    client.createMessage(session.game_slug, session.id, token, content)
      .then((response) => {
        if (!response.ok) return response.json().then((data) => setFieldErrors(data.errors ?? {}));

        setContent('');
        return messagesController.loadFirstPage(session.game_slug, session.id);
      })
      .finally(() => setPosting(false));
  };

  return GameSessionHelper.render(
    session,
    { messages, nextEntryId, loadingMore, content, posting, fieldErrors },
    {
      onLoadMore: handleLoadMore,
      onContentChange: (event) => setContent(event.target.value),
      onSubmit: handleSubmit,
    },
  );
}
