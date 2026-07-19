import { useEffect, useMemo, useState } from 'react';
import GamePollNewController from './controllers/GamePollNewController.js';
import Noop from '../../../../utils/Noop.js';
import GamePollNewHelper from './helpers/GamePollNewHelper.jsx';
import { OPTION_TYPE_TEXT } from './elements/PollOptionType.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

const POLL_TYPE_SINGLE = 'single';

/**
 * Game poll creation page.
 *
 * @returns {React.ReactElement} Game poll creation page element.
 */
export default function GamePollNew() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState(POLL_TYPE_SINGLE);
  const [optionType, setOptionType] = useState(OPTION_TYPE_TEXT);
  const [options, setOptions] = useState(['']);

  const controller = useMemo(
    () => new GamePollNewController(Noop.noop, setFieldErrors),
    [],
  );

  const currentHash = getCurrentHash();
  const gameSlug = GamePollNewController.getGameSlugFromPollNewHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    {
      title, description, type, option_type: optionType, options,
    },
    { setStatus, setFieldErrors },
  );

  return GamePollNewHelper.render(
    {
      title, description, type, optionType, options, status, fieldErrors,
    },
    {
      onSubmit: handleSubmit,
      onTitleChange: (event) => setTitle(event.target.value),
      onDescriptionChange: (event) => setDescription(event.target.value),
      onTypeChange: (value) => setType(value),
      onOptionTypeChange: (value) => setOptionType(value),
      onOptionChange: (index, value) => GamePollNewController.handleOptionChange(
        index, value, options, setOptions,
      ),
      onOptionRemove: (index) => GamePollNewController.handleOptionRemove(index, options, setOptions),
    },
  );
}
