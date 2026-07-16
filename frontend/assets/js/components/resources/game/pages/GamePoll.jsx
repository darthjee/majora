import { useEffect, useMemo, useState } from 'react';
import GamePollController from './controllers/GamePollController.js';
import GamePollHelper from './helpers/GamePollHelper.jsx';
import PollCloseModal from './elements/PollCloseModal.jsx';

/**
 * Game poll detail page, showing a single poll's title, description, type,
 * status, and its options. Gated client-side to the game's DM(s), players,
 * and admins, since the underlying endpoint 401/403s anyone else. DMs and
 * players can cast vote(s) for an open poll's options; admins who are not
 * also a DM or player can view the same controls, disabled. The game's
 * DM(s) and superusers additionally see a "Close Poll" button while the
 * poll is open, which locks in a winning option via a confirmation modal.
 *
 * @returns {React.ReactElement} Game poll detail page element.
 */
export default function GamePoll() {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canVote, setCanVote] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [selectedOptionIds, setSelectedOptionIds] = useState([]);
  const [voteStatus, setVoteStatus] = useState('idle');
  const [showCloseModal, setShowCloseModal] = useState(false);

  const controller = useMemo(
    () => new GamePollController(setPoll, setLoading, setError, null, setCanVote, setCanClose, setSelectedOptionIds),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  if (loading) return GamePollHelper.renderLoading();
  if (error) return GamePollHelper.renderError(error);

  const handleToggleOption = (optionId) => {
    setSelectedOptionIds((current) => GamePollController.toggleSelection(poll.type, optionId, current));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    controller.castVotes(poll.game_slug, poll.id, selectedOptionIds, { setSelectedOptionIds, setVoteStatus });
  };

  const handlePollClosed = (closedPoll) => {
    setShowCloseModal(false);
    setPoll({ ...closedPoll, game_slug: poll.game_slug });
  };

  return (
    <>
      {GamePollHelper.render(
        poll,
        { canVote, selectedOptionIds, voteStatus },
        {
          onToggleOption: handleToggleOption,
          onSubmit: handleSubmit,
          onOpenCloseModal: () => setShowCloseModal(true),
        },
        { canClose },
      )}
      <PollCloseModal
        show={showCloseModal}
        poll={poll}
        onCancel={() => setShowCloseModal(false)}
        onClosed={handlePollClosed}
      />
    </>
  );
}
