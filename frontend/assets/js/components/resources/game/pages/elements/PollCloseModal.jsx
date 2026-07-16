import { useEffect, useMemo, useState } from 'react';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import PollCloseModalController from './controllers/PollCloseModalController.js';
import PollCloseModalHelper from './helpers/PollCloseModalHelper.jsx';

/**
 * Stateful confirmation modal for closing an open poll. Whenever it opens,
 * fetches every vote cast for the poll to tally counts per option (so the
 * modal can preview/highlight the winner) without a dedicated preview
 * endpoint, and resets its local edit state (the "Override Decision" switch
 * and radio selection). Submits an empty payload in the default (off) state,
 * letting the server auto-pick the winner, or the radio-selected option id
 * once "Override Decision" is on.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {object|null} props.poll - Poll being closed (`id`, `title`, `type`, `options`,
 *   `option_type`, `game_slug`), or `null` while the page hasn't loaded it yet.
 * @param {Function} props.onCancel - Called to close the modal without effect.
 * @param {Function} props.onClosed - Called with the closed poll payload on a successful close.
 * @returns {React.ReactElement|null} Rendered poll close confirmation modal, or `null`
 *   when no poll is loaded yet.
 */
export default function PollCloseModal({
  show, poll, onCancel, onClosed,
}) {
  const [override, setOverride] = useState(false);
  const [tallies, setTallies] = useState({});
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [status, setStatus] = useState('idle');

  const controller = useMemo(() => new PollCloseModalController(), []);

  useEffect(() => {
    if (!show || !poll) {
      return undefined;
    }

    let active = true;

    setOverride(false);
    setSelectedOptionId(null);
    setStatus('idle');

    controller.fetchTallies(poll.game_slug, poll.id, AuthStorage.getToken())
      .then((result) => active && setTallies(result))
      .catch(() => active && setTallies({}));

    return () => {
      active = false;
    };
  }, [show, poll, controller]);

  if (!poll) {
    return null;
  }

  const options = poll.options ?? [];
  const maxVoteOptionIds = PollCloseModalController.resolveMaxVoteOptionIds(options, tallies);
  const effectiveWinnerId = PollCloseModalController.resolveEffectiveWinnerId(maxVoteOptionIds);

  const handleSubmit = () => {
    controller.closePoll(poll.game_slug, poll.id, AuthStorage.getToken(), override ? selectedOptionId : null, {
      setStatus,
      onClosed,
    });
  };

  return PollCloseModalHelper.render(
    show,
    poll,
    {
      override, maxVoteOptionIds, effectiveWinnerId, selectedOptionId, status,
    },
    {
      onCancel,
      onToggleOverride: () => setOverride((current) => !current),
      onSelectOption: setSelectedOptionId,
      onSubmit: handleSubmit,
    },
  );
}
