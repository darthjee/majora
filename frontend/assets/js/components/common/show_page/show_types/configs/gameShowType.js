import DescriptionBox from '../../../misc/DescriptionBox.jsx';
import LinkList from '../../../misc/LinkList.jsx';
import GameCoverPhoto from '../../../../resources/game/pages/elements/show/GameCoverPhoto.jsx';
import GameNextSessionBlock from '../../../../resources/game/pages/elements/show/GameNextSessionBlock.jsx';
import GameOpenPollsWidgetSlot from '../../../../resources/game/pages/elements/show/GameOpenPollsWidgetSlot.jsx';
import GameHeading from '../../../../resources/game/pages/elements/show/GameHeading.jsx';
import GamePreviewSections from '../../../../resources/game/pages/elements/show/GamePreviewSections.jsx';
import GameNameField from '../../../../resources/game/pages/elements/show/GameNameField.jsx';
import GameDescriptionField from '../../../../resources/game/pages/elements/show/GameDescriptionField.jsx';
import GameTypeSelect from '../../../../resources/game/pages/elements/show/GameTypeSelect.jsx';
import GameSubmitButton from '../../../../resources/game/pages/elements/show/GameSubmitButton.jsx';

/**
 * `showTypeConfig` entry for the `game` show/new/edit pages. `new` has no natural left-side
 * content (game creation has always been a plain single-column form) — `GameCoverPhoto` simply
 * doesn't declare a `New` variant, so it renders nothing for that mode.
 */
const gameShowType = {
  left: [
    { Show: GameCoverPhoto, Edit: GameCoverPhoto },
    { Show: GameNextSessionBlock },
    { Show: GameOpenPollsWidgetSlot },
  ],
  right: [
    GameHeading,
    { Show: DescriptionBox },
    { Show: LinkList },
    { Show: GamePreviewSections },
    { New: GameNameField, Edit: GameNameField },
    { New: GameDescriptionField, Edit: GameDescriptionField },
    { New: GameTypeSelect },
    { New: GameSubmitButton, Edit: GameSubmitButton },
  ],
  bottom: [],
};

export default gameShowType;
