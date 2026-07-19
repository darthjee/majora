import { useEffect, useMemo, useState } from 'react';
import GameSessionController from './controllers/GameSessionController.js';
import SessionMessagesController from './controllers/SessionMessagesController.js';
import AuthStorage from '../../../../utils/auth/AuthStorage.js';
import GameSessionHelper from './helpers/GameSessionHelper.jsx';
import CreateSessionPollModal from './elements/CreateSessionPollModal.jsx';
import Translator from '../../../../i18n/Translator.js';

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

  const [showPollModal, setShowPollModal] = useState(false);
  const [pollStatus, setPollStatus] = useState('idle');

  const controller = useMemo(
    () => new GameSessionController(setSession, setLoading, setError),
    [],
  );

  const messagesController = useMemo(
    () => new SessionMessagesController(setMessages, setNextEntryId, setLoadingMore),
    [],
  );

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

    const token = AuthStorage.getToken();

    return messagesController.postMessage(
      session.game_slug, session.id, token, content, { setContent, setFieldErrors, setPosting },
    );
  };

  const handleCreatePoll = (dates, type) => controller.submitPoll(
    session.game_slug, session.id, dates, type, { setPollStatus },
  );

  return (
    <>
      {GameSessionHelper.render(
        session,
        { messages, nextEntryId, loadingMore, content, posting, fieldErrors },
        {
          onLoadMore: handleLoadMore,
          onContentChange: (event) => setContent(event.target.value),
          onSubmit: handleSubmit,
        },
        () => setShowPollModal(true),
      )}
      <CreateSessionPollModal
        show={showPollModal}
        error={pollStatus === 'error' ? Translator.t('session_poll_modal.error') : ''}
        onClose={() => setShowPollModal(false)}
        onConfirm={handleCreatePoll}
      />
    </>
  );
}
