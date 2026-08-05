import DescriptionBox from '../../../misc/DescriptionBox.jsx';
import GameCoverPhoto from '../../../../resources/game/pages/elements/show/GameCoverPhoto.jsx';
import GameLinksShow, { buildGameLinksField } from '../../../../resources/game/pages/elements/show/GameLinksSlot.jsx';
import GameNextSessionBlock from '../../../../resources/game/pages/elements/show/GameNextSessionBlock.jsx';
import GameOpenPollsWidgetSlot from '../../../../resources/game/pages/elements/show/GameOpenPollsWidgetSlot.jsx';
import GameHeading from '../../../../resources/game/pages/elements/show/GameHeading.jsx';
import buildShortListSlot from '../../../cards/buildShortListSlot.js';
import GameNameField from '../../../../resources/game/pages/elements/show/GameNameField.jsx';
import GameDescriptionField from '../../../../resources/game/pages/elements/show/GameDescriptionField.jsx';
import GameTypeSelect from '../../../../resources/game/pages/elements/show/GameTypeSelect.jsx';
import GameSubmitButton from '../../../../resources/game/pages/elements/show/GameSubmitButton.jsx';

const gameLinksField = buildGameLinksField('game_edit_page.edit_links_button');

/**
 * `showTypeConfig` entry for the `game` show/new/edit pages. `new` has no natural left-side
 * content (game creation has always been a plain single-column form) — `GameCoverPhoto` simply
 * doesn't declare a `New` variant, so it renders nothing for that mode.
 */
const gameShowType = {
  left: [
    { Show: GameCoverPhoto, Edit: GameCoverPhoto },
    { Show: GameLinksShow, Edit: gameLinksField },
    { Show: GameNextSessionBlock },
    { Show: GameOpenPollsWidgetSlot },
  ],
  right: [
    GameHeading,
    { Show: DescriptionBox },
    { Show: buildShortListSlot('pc') },
    { Show: buildShortListSlot('npc') },
    { New: GameNameField, Edit: GameNameField },
    { New: GameDescriptionField, Edit: GameDescriptionField },
    { New: GameTypeSelect },
    { New: GameSubmitButton, Edit: GameSubmitButton },
  ],
  bottom: [],
};

export default gameShowType;
