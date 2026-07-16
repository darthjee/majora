import { useEffect, useMemo, useState } from 'react';
import GamePollController from './controllers/GamePollController.js';
import GamePollHelper from './helpers/GamePollHelper.jsx';

/**
 * Game poll detail page, showing a single poll's title, description, type,
 * status, and its options. Gated client-side to the game's DM(s), players,
 * and admins, since the underlying endpoint 401/403s anyone else. DMs and
 * players can cast vote(s) for an open poll's options; admins who are not
 * also a DM or player can view the same controls, disabled.
 *
 * @returns {React.ReactElement} Game poll detail page element.
 */
export default function GamePoll() {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canVote, setCanVote] = useState(false);
  const [selectedOptionIds, setSelectedOptionIds] = useState([]);
  const [voteStatus, setVoteStatus] = useState('idle');

  const controller = useMemo(
    () => new GamePollController(setPoll, setLoading, setError, null, setCanVote, setSelectedOptionIds),
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

  return GamePollHelper.render(
    poll,
    { canVote, selectedOptionIds, voteStatus },
    { onToggleOption: handleToggleOption, onSubmit: handleSubmit },
  );
}
