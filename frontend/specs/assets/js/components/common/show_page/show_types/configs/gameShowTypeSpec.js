import gameShowType
  from '../../../../../../../../assets/js/components/common/show_page/show_types/configs/gameShowType.js';
import GameCoverPhoto
  from '../../../../../../../../assets/js/components/resources/game/pages/elements/show/GameCoverPhoto.jsx';
import GameNameField
  from '../../../../../../../../assets/js/components/resources/game/pages/elements/show/GameNameField.jsx';
import GameSubmitButton
  from '../../../../../../../../assets/js/components/resources/game/pages/elements/show/GameSubmitButton.jsx';
import GameTypeSelect
  from '../../../../../../../../assets/js/components/resources/game/pages/elements/show/GameTypeSelect.jsx';

describe('gameShowType', function() {
  it('shows the pc/npc shortlists only on the show page', function() {
    const shortListEntries = gameShowType.right.filter(
      (entry) => entry.Show && entry.Show.name === 'ShortListSlot',
    );
    const resources = shortListEntries.map((entry) => entry.Show({}).props.resource);

    expect(resources).toEqual(['pc', 'npc']);
    shortListEntries.forEach((entry) => {
      expect(entry.New).toBeUndefined();
      expect(entry.Edit).toBeUndefined();
    });
  });


  it('only offers a left column for show and edit, not new', function() {
    const coverPhotoEntry = gameShowType.left.find((entry) => entry.Show === GameCoverPhoto);

    expect(coverPhotoEntry.Edit).toBe(GameCoverPhoto);
    expect(coverPhotoEntry.New).toBeUndefined();
  });

  it('shares the name field between new and edit', function() {
    const nameEntry = gameShowType.right.find((entry) => entry.New === GameNameField);

    expect(nameEntry.Edit).toBe(GameNameField);
  });

  it('offers the game-type select only on the new form', function() {
    const typeEntry = gameShowType.right.find((entry) => entry && entry.New === GameTypeSelect);

    expect(typeEntry.Show).toBeUndefined();
    expect(typeEntry.Edit).toBeUndefined();
  });

  it('shares the submit button between new and edit', function() {
    const submitEntry = gameShowType.right.find((entry) => entry && entry.New === GameSubmitButton);

    expect(submitEntry.Edit).toBe(GameSubmitButton);
  });

  it('has no bottom-slot content', function() {
    expect(gameShowType.bottom).toEqual([]);
  });
});
